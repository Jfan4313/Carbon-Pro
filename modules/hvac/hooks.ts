import { useState, useEffect, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { calculateIRR, generateStandardCashFlows } from '../../utils/financial';
import { HvacGlobalParams, HvacBuilding, HvacSchedule, HvacFinancials } from './types';

// ==========================================
// 真实项目参考 (5万㎡办公园区, 年空调电费约200万)
// | 方案              | 投入   | 节电率  | 年省电费 | 回收期 |
// | 仅变频+零件       | 30万   | 8-12%   | ~20万   | 1.5年  |
// | AI智控(不换主机)  | 50万   | 15-20%  | ~35万   | 1.4年  |
// | 主机+全系统智控   | 200万  | 35-45%  | ~80万   | 2.5年  |
// ==========================================
export const STRATEGIES = {
    vfd: { name: '基础变频/零件改造', targetSCOP: 3.4, unitCost: 150 },         // ~150元/kW
    ai_control: { name: 'AI 智控系统 (不换机)', targetSCOP: 3.8, unitCost: 250 },    // ~250元/kW
    full_retrofit: { name: '全系统高效机房 (磁悬浮+AI)', targetSCOP: 5.5, unitCost: 900 }, // ~900元/kW
    cchp: { name: '燃气三联供 (CCHP)', targetSCOP: 7.5, unitCost: 1800 }       // ~1800元/kW
};

export function useHvacLogic() {
    const { modules, toggleModule, updateModule, saveProject, priceConfig, projectBaseInfo } = useProject();
    const currentModule = modules['retrofit-hvac'];
    const savedParams = currentModule.params || {};

    // Get O&M rate from global project context
    const omRate = projectBaseInfo?.omRate || 1.0;
    const insuranceRate = projectBaseInfo?.insuranceRate ?? 0.35;

    const [mode, setMode] = useState<'simple' | 'advanced'>(savedParams.mode || 'simple');

    // --- State ---
    const defaultGlobalParams: HvacGlobalParams = {
        electricityPrice: 0.85,
        gasPrice: 3.5,
        currentAvgCOP: 3.2,
        baseSystemSCOP: 2.3, // EXPERT: 老旧机房管理不善时，综合能效常低于2.3
        avgLoadFactor: 0.6, // EXPERT: 平均负载率 (0~1.0)
        aiGainFactor: 1.15, // EXPERT: 深度AI介入可额外提升 15% 效率
        occupancyFactor: 0.9, // 入驻率/使用负荷修正
        climateAdjust: 1.0, // 气象度日数修正
        discountRate: 5.0,
        maintenanceGrowth: 2.0,
        investmentMode: 'self',
        emcOwnerShareRate: 20,
        hardwareCost: 0,
        installCost: 0,
        systemCost: 0,
        auxCost: 0
    };

    const [globalParams, setGlobalParams] = useState<HvacGlobalParams>({
        ...defaultGlobalParams,
        ...(savedParams.globalParams || {})
    });

    const [schedule, setSchedule] = useState<HvacSchedule>(savedParams.schedule || { start: 8, end: 18 });

    // 默认示例: 高回报工业场景 + 商务办公 (综合回报约1.8年)
    const [hvacBuildings, setHvacBuildings] = useState<HvacBuilding[]>(savedParams.hvacBuildings || [
        { id: 1, name: '数据中心/净化车间', desc: '全年24h高负荷运行，极速回本', load: 1000, area: 10000, active: true, strategy: 'ai_control', runHours: 6500, costMode: 'power', customUnitCost: 0, customTotalInvest: 0, customCOP: 0 },
        { id: 2, name: '标准商务办公楼', desc: '传统中央空调, 螺杆机', load: 600, area: 8000, active: true, strategy: 'vfd', runHours: 2500, costMode: 'power', customUnitCost: 0, customTotalInvest: 0, customCOP: 0 }
    ]);

    const [isChartExpanded, setIsChartExpanded] = useState(false);
    const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);

    // --- Calculations ---
    const financials: HvacFinancials = useMemo(() => {
        let totalInvest = 0;
        let totalYearlySaving = 0;
        let cchpGasCost = 0;
        let cchpElecGen = 0;

        hvacBuildings.forEach((b) => {
            if (!b.active) return;

            // EXPERT: Guard against stale keys from previous sessions
            let strategyKey = b.strategy;
            if (strategyKey === 'basic') strategyKey = 'vfd';
            if (strategyKey === 'intermediate') strategyKey = 'ai_control';
            if (strategyKey === 'advanced') strategyKey = 'full_retrofit';

            const strat = STRATEGIES[strategyKey as keyof typeof STRATEGIES] || STRATEGIES.vfd;

            let invest = 0;
            if (mode === 'simple') {
                invest = (b.load * strat.unitCost) / 10000;
            } else {
                if (b.costMode === 'fixed') invest = b.customTotalInvest;
                else if (b.costMode === 'area') invest = (b.area * (b.customUnitCost || 200)) / 10000;
                else invest = (b.load * (b.customUnitCost || strat.unitCost)) / 10000;
            }
            totalInvest += invest;

            // EXPERT ALGORITHM: Real Cooling Demand = Peak Load * Run Hours * Average Load Factor * Occupancy * Climate
            const adjustedBaseLoad = b.load * globalParams.occupancyFactor * globalParams.climateAdjust;
            const coolingLoadDemand = adjustedBaseLoad * b.runHours * globalParams.avgLoadFactor;

            // Baseline uses System SCOP instead of single chiller COP
            const baselineElecCost = (coolingLoadDemand / globalParams.baseSystemSCOP * globalParams.electricityPrice) / 10000;

            if (b.strategy === 'cchp') {
                const equivalentElecNeeded = coolingLoadDemand / strat.targetSCOP;
                const gasNeededVolume = equivalentElecNeeded / 3.5;
                const gasCost = (gasNeededVolume * globalParams.gasPrice) / 10000;

                const extraElecGen = gasNeededVolume * 0.5;
                const extraElecValue = (extraElecGen * globalParams.electricityPrice) / 10000;

                cchpGasCost += gasCost;
                cchpElecGen += extraElecGen;

                const saving = baselineElecCost - gasCost + extraElecValue;
                totalYearlySaving += saving;
            } else {
                const effSCOP = (mode === 'advanced' && b.customCOP > 0) ? b.customCOP : strat.targetSCOP;
                // AI Gain Factor applies to management strategies (ai_control, full_retrofit)
                const actualEffSCOP = (b.strategy === 'ai_control' || b.strategy === 'full_retrofit')
                    ? effSCOP * globalParams.aiGainFactor
                    : effSCOP;

                const newElecCost = (coolingLoadDemand / actualEffSCOP * globalParams.electricityPrice) / 10000;

                const saving = baselineElecCost - newElecCost;
                totalYearlySaving += saving;
            }
        });

        // Use detailed costs if specified, otherwise keep the calculated totalInvest
        const detailedTotal = (globalParams.hardwareCost || 0) + (globalParams.installCost || 0) + (globalParams.systemCost || 0) + (globalParams.auxCost || 0);
        if (detailedTotal > 0) {
            totalInvest = detailedTotal;
        }

        const isEmc = globalParams.investmentMode === 'emc';
        const ownerShareRate = isEmc ? (globalParams.emcOwnerShareRate / 100) : 0;

        const ownerBenefit = isEmc ? (totalYearlySaving * ownerShareRate) : totalYearlySaving;
        const investorRevenue = isEmc ? (totalYearlySaving * (1 - ownerShareRate)) : totalYearlySaving;

        // O&M Cost Deduction Loop
        const opexYearly = totalInvest * ((omRate + insuranceRate) / 100);
        let cumulativeInvestorCash = -totalInvest;
        let paybackY = 0;
        let paybackFound = false;

        const cashFlows = [-totalInvest];
        for (let y = 1; y <= 15; y++) {
            const netCashFlow = investorRevenue - opexYearly;
            cashFlows.push(netCashFlow);

            const prevCumulative = cumulativeInvestorCash;
            cumulativeInvestorCash += netCashFlow;

            if (!paybackFound && cumulativeInvestorCash >= 0) {
                paybackY = (y - 1) + (Math.abs(prevCumulative) / netCashFlow);
                paybackFound = true;
            }
        }

        if (!paybackFound) paybackY = 16;

        // 统一 25 年期标准 IRR (Phase 10)
        const stdCashFlows = generateStandardCashFlows({
            totalInvestment: totalInvest,
            totalGrossSaving: investorRevenue,
            omRate: omRate,
            insuranceRate: insuranceRate,
            taxRate: projectBaseInfo?.taxRate ?? 5.0,
            vatRate: projectBaseInfo?.vatRate ?? 13.0,
            vatExtraRate: projectBaseInfo?.vatExtraRate ?? 1.56,
            period: 25
        });
        const irr = totalInvest > 0 ? calculateIRR(stdCashFlows) : 0;
        const payback = paybackY;

        // Calculate HVAC specific yearly details for transparency
        const yearlyDetails = [];
        let accumulatedDepreciation = 0;
        const vatRate = projectBaseInfo?.vatRate ?? 13.0;
        const taxRate = projectBaseInfo?.taxRate ?? 5.0;
        const vatExtraRate = projectBaseInfo?.vatExtraRate ?? 1.56;
        let vatCarryForward = totalInvest - (totalInvest / (1 + vatRate / 100));

        for (let year = 1; year <= 25; year++) {
            const currentYearGross = investorRevenue;

            const baseOpex = totalInvest * (omRate / 100);
            const insurance = totalInvest * (insuranceRate / 100);
            const totalOpex = baseOpex + insurance;

            const investmentNet = totalInvest / (1 + vatRate / 100);
            let dp = 0;
            if (year <= 8) {
                dp = (investmentNet - accumulatedDepreciation) * (2 / 10);
                accumulatedDepreciation += dp;
            } else if (year === 9 || year === 10) {
                const remaining = investmentNet - accumulatedDepreciation;
                dp = remaining / 2;
            }

            const revenueNet = currentYearGross / (1 + vatRate / 100);
            const outputVat = currentYearGross - revenueNet;
            const opexInputVat = totalOpex * 0.05;

            let vatPayable = outputVat - opexInputVat - vatCarryForward;
            if (vatPayable < 0) {
                vatCarryForward = -vatPayable;
                vatPayable = 0;
            } else {
                vatCarryForward = 0;
            }

            const vatSurcharge = vatPayable * (vatExtraRate / 100);

            const taxableIncomeCalc = revenueNet - totalOpex - dp - vatSurcharge;
            const incTax = taxableIncomeCalc > 0 ? taxableIncomeCalc * (taxRate / 100) : 0;
            const netInc = currentYearGross - totalOpex - vatPayable - vatSurcharge - incTax;

            yearlyDetails.push({
                year,
                revenue: parseFloat(currentYearGross.toFixed(2)),
                ownerBenefit: parseFloat(ownerBenefit.toFixed(2)),
                om: parseFloat(baseOpex.toFixed(2)),
                insurance: parseFloat(insurance.toFixed(2)),
                tax: parseFloat((vatPayable + vatSurcharge + incTax).toFixed(2)),
                incomeTax: parseFloat(incTax.toFixed(2)),
                netIncome: parseFloat(netInc.toFixed(2))
            });
        }

        return {
            totalInvestment: parseFloat(totalInvest.toFixed(3)),
            totalYearlySaving: parseFloat(totalYearlySaving.toFixed(3)),
            ownerBenefit: parseFloat(ownerBenefit.toFixed(3)),
            investorRevenue: parseFloat(investorRevenue.toFixed(3)),
            cchpGasCost: parseFloat(cchpGasCost.toFixed(2)),
            irr,
            paybackPeriod: parseFloat(payback.toFixed(3)),
            cashFlows: stdCashFlows,
            yearlyDetails
        };
    }, [hvacBuildings, mode, globalParams]);

    // Sync electricity price from priceConfig
    // Sync electricity price from priceConfig, weighted by hvac running schedule
    useEffect(() => {
        let newPrice = 0.85;

        if (priceConfig.mode === 'fixed') {
            newPrice = priceConfig.fixedPrice;
        } else if (priceConfig.mode === 'tou') {
            // EXPERT: We must calculate weighted price based on HVAC running hours ONLY.
            // Air conditioning mostly runs during peak daytime hours when electricity is expensive.
            let weightedSum = 0;
            let totalRunningDuration = 0;

            priceConfig.touSegments.forEach(seg => {
                // Find intersection of segment [seg.start, seg.end] and schedule [schedule.start, schedule.end]
                const intersectStart = Math.max(seg.start, schedule.start);
                const intersectEnd = Math.min(seg.end, schedule.end);

                if (intersectEnd > intersectStart) {
                    const duration = intersectEnd - intersectStart;
                    weightedSum += seg.price * duration;
                    totalRunningDuration += duration;
                }
            });

            newPrice = totalRunningDuration > 0 ? weightedSum / totalRunningDuration : 0.85;
        } else if (priceConfig.mode === 'spot') {
            // Average spot prices within the schedule window
            const relevantPrices = priceConfig.spotPrices.slice(schedule.start, schedule.end);
            if (relevantPrices.length > 0) {
                newPrice = relevantPrices.reduce((s, p) => s + p, 0) / relevantPrices.length;
            }
        }

        if (Math.abs(globalParams.electricityPrice - newPrice) > 0.0001) {
            setGlobalParams(prev => ({ ...prev, electricityPrice: parseFloat(newPrice.toFixed(4)) }));
        }
    }, [priceConfig.mode, priceConfig.fixedPrice, priceConfig.touSegments, priceConfig.spotPrices, schedule.start, schedule.end]);

    const chartData = useMemo(() => [
        { name: '1月', base: 45, retrofit: 35 }, { name: '2月', base: 40, retrofit: 30 },
        { name: '3月', base: 55, retrofit: 42 }, { name: '4月', base: 70, retrofit: 55 },
        { name: '5月', base: 90, retrofit: 65 }, { name: '6月', base: 120, retrofit: 85 },
        { name: '7月', base: 150, retrofit: 105 }, { name: '8月', base: 145, retrofit: 100 },
        { name: '9月', base: 110, retrofit: 80 }, { name: '10月', base: 80, retrofit: 60 },
        { name: '11月', base: 60, retrofit: 45 }, { name: '12月', base: 50, retrofit: 38 }
    ], []);

    // Update Context
    useEffect(() => {
        const newParams = { mode, globalParams, schedule, hvacBuildings };
        const currentStoredParams = JSON.stringify(currentModule.params);

        if (currentStoredParams !== JSON.stringify(newParams)) {
            updateModule('retrofit-hvac', {
                investment: financials.totalInvestment,
                yearlySaving: financials.investorRevenue,
                ownerBenefit: financials.ownerBenefit,
                kpiPrimary: { label: '年节电费用', value: `${(financials.totalYearlySaving || 0).toFixed(1)} 万元` },
                kpiSecondary: {
                    label: '目标系统能效(SCOP)', value: `提升至 ${(hvacBuildings.reduce((sum, b) => {
                        if (!b.active) return sum;
                        let sk = b.strategy;
                        if (sk === 'basic') sk = 'vfd';
                        if (sk === 'intermediate') sk = 'ai_control';
                        if (sk === 'advanced') sk = 'full_retrofit';
                        return sum + ((STRATEGIES[sk as keyof typeof STRATEGIES] || STRATEGIES.vfd).targetSCOP);
                    }, 0) / (hvacBuildings.filter(b => b.active).length || 1)).toFixed(1)}`
                },
                strategy: mode === 'simple' ? '快速测算' : '精确估值',
                params: newParams
            });
        }
    }, [mode, globalParams, schedule, hvacBuildings, financials, updateModule, currentModule.params]);

    return {
        mode, setMode,
        globalParams, setGlobalParams,
        schedule, setSchedule,
        hvacBuildings, setHvacBuildings,
        isChartExpanded, setIsChartExpanded,
        isFinancialModalOpen, setIsFinancialModalOpen,
        financials,
        chartData,
        currentModule,
        toggleModule,
        saveProject,
        toggleBuilding: (id: number) => setHvacBuildings(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b)),
        updateBuildingRunHours: (id: number, hours: number) => setHvacBuildings(prev => prev.map(b => b.id === id ? { ...b, runHours: hours } : b)),
        updateBuildingStrategy: (id: number, strategy: string) => setHvacBuildings(prev => prev.map(b => b.id === id ? { ...b, strategy } : b)),
        updateBuildingSimpleField: (id: number, field: keyof HvacBuilding, value: any) => setHvacBuildings(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b)),
        projectBaseInfo,
        omRate
    };
}
