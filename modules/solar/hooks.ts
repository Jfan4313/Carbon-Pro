import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import { calculateCampusConsumptionRate, ConsumptionResult } from '../../services/campusConsumption';
import { getSunHours } from '../../services/solarData';
import { DEFAULTS, SolarParamsState, BuildingData } from './types';
import { calculateIRR, generateStandardCashFlows, calculatePaybackPeriod } from '../../utils/financial';

export const useSolarRetrofit = () => {
    const { modules, toggleModule, updateModule, saveProject, transformers, bills, projectBaseInfo, priceConfig } = useProject();
    const currentModule = modules['retrofit-solar'];

    // Fallback to defaults if params are not set
    const params: SolarParamsState = {
        mode: currentModule?.params?.mode || DEFAULTS.mode,
        simpleParams: { ...DEFAULTS.simpleParams, ...currentModule?.params?.simpleParams },
        advParams: { ...DEFAULTS.advParams, ...currentModule?.params?.advParams }
    };

    // UI Local State
    const [selfUseMode, setSelfUseMode] = useState<'auto' | 'manual'>('auto');
    const [calculatedSelfConsumption, setCalculatedSelfConsumption] = useState(85);
    const [consumptionResult, setConsumptionResult] = useState<ConsumptionResult | null>(null);
    const [buildings, setBuildings] = useState<BuildingData[]>([
        { id: 1, name: '1号车间', area: 5000, active: true, manualCapacity: 400, transformerId: 0 }
    ]);

    const locationKey = `${projectBaseInfo?.province}-${projectBaseInfo?.city}`;
    const lastLocation = useRef<string>(locationKey);

    // Get O&M rate from global project context
    const omRate = projectBaseInfo?.omRate || 1.5;

    // Financial Calculation Core
    // ========== 核心财务测算 ==========
    // 返回值中的 yearlySaving 为【投资方视角】的净收益（即系统汇总使用的指标）
    // ownerBenefit 为【业主视角】的收益（EMC 模式下业主侧收益）
    const calculateFinancials = useCallback((p: SolarParamsState, selfRate: number) => {
        const capacity = p.simpleParams.capacity || 0;
        let investment = parseFloat((capacity * p.simpleParams.epcPrice / 10).toFixed(2)); // 万元

        // Use detailed costs if specified
        const detailedTotal = (p.advParams.hardwareCost || 0) + (p.advParams.inverterCost || 0) + (p.advParams.installCost || 0) + (p.advParams.civilCost || 0);
        if (detailedTotal > 0) {
            investment = detailedTotal;
        }

        // 首年总发电量 (万度 = 万kWh)
        const genYear1 = capacity * p.advParams.dailySunHours * p.advParams.generationDays
            * (p.advParams.prValue / 100) * (p.advParams.azimuthEfficiency / 100) / 10000;

        const selfUseGen = genYear1 * (selfRate / 100); // 自用电量 (万度)
        const gridGen = genYear1 * (1 - selfRate / 100); // 上网电量 (万度)

        // 总电费毛收益（无分成的情况下）
        const totalSelfUseRevenue = selfUseGen * p.advParams.electricityPrice; // 自用部分总价值 (万元)
        const gridRevenue = gridGen * p.advParams.feedInTariff; // 上网收入 (万元)
        const roofRentIncome = p.simpleParams.area * p.advParams.roofRent / 10000; // 屋顶租金 (万元/年)

        let investorRevenue = 0; // 投资方年收益
        let ownerBenefit = 0;    // 业主年收益

        if (p.simpleParams.investmentMode === 'emc') {
            if (p.simpleParams.emcSubMode === 'sharing') {
                // ===== 收益分成模式 =====
                // 业主获得 ownerShareRate% 的自用电费收益 + 屋顶租金
                // 投资方获得 (100 - ownerShareRate)% 的自用电费收益 + 全部上网收入, 需承担运维
                const ownerShare = p.advParams.emcOwnerShareRate / 100;
                ownerBenefit = totalSelfUseRevenue * ownerShare + roofRentIncome;
                investorRevenue = totalSelfUseRevenue * (1 - ownerShare) + gridRevenue - roofRentIncome;
            } else {
                // ===== 折扣电价模式 =====
                // 投资方以折扣价向业主售电 → 投资方的自用收入 = 自用电量 × 折扣电价
                // 业主节省 = 自用电量 × (市电价 - 折扣价) + 屋顶租金
                const discountRevenue = selfUseGen * p.advParams.emcDiscountPrice; // 投资方售电收入
                ownerBenefit = selfUseGen * (p.advParams.electricityPrice - p.advParams.emcDiscountPrice) + roofRentIncome;
                investorRevenue = discountRevenue + gridRevenue - roofRentIncome;
            }
        } else {
            // 自投 / 贷款 / EPC：全部收益归投资方(业主=投资方)
            investorRevenue = totalSelfUseRevenue + gridRevenue;
            ownerBenefit = investorRevenue; // 业主即投资方
        }

        const taxRate = projectBaseInfo?.taxRate ?? 5.0;
        const vatRate = projectBaseInfo?.vatRate ?? 13.0;
        const vatExtraRate = projectBaseInfo?.vatExtraRate ?? 6.0;
        const omRate = projectBaseInfo?.omRate ?? 1.0;
        const insuranceRate = projectBaseInfo?.insuranceRate ?? 0.35;


        // Phase 10: Harmonization - Report GROSS saving to context, let global engine handle O&M/Tax
        const yearlySaving = parseFloat(investorRevenue.toFixed(2)); // 投资方毛收益 (不扣运维税费)

        // 局部 IRR 和净现金流测定 
        const stdCashFlows = generateStandardCashFlows({
            totalInvestment: investment,
            totalGrossSaving: investorRevenue,
            omRate: (capacity * p.advParams.omCost / 10) / investment * 100, // exact W cost mapping
            insuranceRate: insuranceRate,
            taxRate: taxRate,
            vatRate: vatRate,
            vatExtraRate: vatExtraRate,
            period: 25
        });

        const irr = calculateIRR(stdCashFlows);
        const netSavingFirstYear = stdCashFlows[1] || 0;

        return {
            investment,
            yearlySaving,
            genYear1,
            ownerBenefit: parseFloat(ownerBenefit.toFixed(2)),
            investorRevenue: parseFloat(investorRevenue.toFixed(2)),
            netSaving: netSavingFirstYear, // 直接复用标准引擎第一年的净现金流
            reportedSaving: investorRevenue - (capacity * p.advParams.omCost / 10),
            irr
        };
    }, [projectBaseInfo?.taxRate, projectBaseInfo?.vatRate, projectBaseInfo?.omRate, projectBaseInfo?.insuranceRate]);

    const metrics = useSolarMetrics(params, calculatedSelfConsumption, bills, projectBaseInfo);
    const { longTermMetrics } = metrics;

    const handleUpdate = useCallback((newParamsPart: Partial<SolarParamsState>) => {
        const newParams = { ...params, ...newParamsPart };
        const financial = calculateFinancials(newParams, calculatedSelfConsumption);

        // 使用针对当前参数实时计算的指标
        // 注意：这里需要再次计算一次以获取最新的 reportedSaving，或者重构 useSolarMetrics
        // 为了保持简单，直接在 handleUpdate 里算一个最新的
        const { investment, reportedSaving, irr } = calculateFinancials(newParams, calculatedSelfConsumption) as any;

        updateModule('retrofit-solar', {
            investment,
            yearlySaving: parseFloat(reportedSaving.toFixed(2)), // 上报扣除运维后的净值
            kpiPrimary: { label: '装机容量', value: `${newParams.simpleParams.capacity.toFixed(2)} kWp` },
            kpiSecondary: { label: '局部 IRR', value: `${irr.toFixed(2)}%` },
            params: newParams
        });
    }, [params, calculatedSelfConsumption, calculateFinancials, updateModule]);

    // Force an update when self consumption rate changes natively via slider or auto-calculation
    useEffect(() => {
        handleUpdate({});
    }, [calculatedSelfConsumption]);

    // Sync Daily Sun Hours from Location or NASA
    useEffect(() => {
        // 如果开启了手动覆盖，不做同步
        if (projectBaseInfo.isSolarManualOverride) return;

        // 1. 优先使用 NASA 精确数据
        if (projectBaseInfo.nasaSolarData && Math.abs(projectBaseInfo.nasaSolarData - params.advParams.dailySunHours) > 0.001) {
            handleUpdate({ advParams: { ...params.advParams, dailySunHours: projectBaseInfo.nasaSolarData } });
            return;
        }

        // 2. 兜底使用省市预设
        const currentLoc = `${projectBaseInfo?.province}-${projectBaseInfo?.city}`;
        if (currentLoc !== lastLocation.current && projectBaseInfo?.province) {
            lastLocation.current = currentLoc;
            const newSunHours = getSunHours(projectBaseInfo.province, projectBaseInfo.city || '');
            if (newSunHours && Math.abs(newSunHours - params.advParams.dailySunHours) > 0.01) {
                handleUpdate({ advParams: { ...params.advParams, dailySunHours: newSunHours } });
            }
        }
    }, [projectBaseInfo?.province, projectBaseInfo?.city, projectBaseInfo?.nasaSolarData, projectBaseInfo.isSolarManualOverride, handleUpdate, params.advParams]);

    // Sync Electricity Price
    useEffect(() => {
        if (params.mode === 'advanced') {
            let newElectricityPrice = DEFAULTS.advParams.electricityPrice;

            if (priceConfig.mode === 'fixed') {
                newElectricityPrice = priceConfig.fixedPrice;
            } else if (priceConfig.mode === 'tou') {
                // 1. 典型的分布式光伏日发电曲线权重 (0-23点，基于实际出力特性)
                const pvCurve = [
                    0, 0, 0, 0, 0, 0,           // 0-5: 无发电
                    0.02, 0.05, 0.08, 0.12, 0.14, 0.16, // 6-11: 爬坡到峰值
                    0.16, 0.14, 0.09, 0.05, 0.02, 0.01, // 12-17: 峰值回落
                    0, 0, 0, 0, 0, 0            // 18-23: 无发电 (简化)
                ];

                // 2. 根据时段定义和出力权重，计算单日“光伏综合度电价值”
                const calcWeightedPrice = (segments: { start: number, end: number, price: number }[]) => {
                    let totalWeightedPrice = 0;
                    let totalWeight = 0;
                    for (let hour = 0; hour < 24; hour++) {
                        const seg = segments.find(s => hour >= s.start && hour < s.end);
                        const price = seg ? seg.price : DEFAULTS.advParams.electricityPrice;
                        const weight = pvCurve[hour];
                        totalWeightedPrice += price * weight;
                        totalWeight += weight;
                    }
                    return totalWeight > 0 ? totalWeightedPrice / totalWeight : DEFAULTS.advParams.electricityPrice;
                };

                const normalEffectivePrice = calcWeightedPrice(priceConfig.touSegments);

                // 3. 结合夏冬令时特殊电价（如有）进行全年月份加权
                if (priceConfig.hasSummer && priceConfig.summerMonths && priceConfig.summerMonths.length > 0 && priceConfig.summerTouSegments) {
                    const summerEffectivePrice = calcWeightedPrice(priceConfig.summerTouSegments);
                    const summerMonthsCount = priceConfig.summerMonths.length;
                    const normalMonthsCount = 12 - summerMonthsCount;
                    newElectricityPrice = (summerEffectivePrice * summerMonthsCount + normalEffectivePrice * normalMonthsCount) / 12;
                } else {
                    newElectricityPrice = normalEffectivePrice;
                }
            } else if (priceConfig.mode === 'spot') {
                const avgSpotPrice = priceConfig.spotPrices.reduce((sum, p) => sum + p, 0) / priceConfig.spotPrices.length;
                newElectricityPrice = avgSpotPrice || DEFAULTS.advParams.electricityPrice;
            }

            if (Math.abs(params.advParams.electricityPrice - newElectricityPrice) > 0.0001) {
                handleUpdate({ advParams: { ...params.advParams, electricityPrice: parseFloat(newElectricityPrice.toFixed(4)) } });
            }
        }
    }, [priceConfig, params.mode, params.advParams.electricityPrice, handleUpdate]);

    // Calculate Consumption
    useEffect(() => {
        if (selfUseMode !== 'auto') return;

        const totalCapacity = params.simpleParams.capacity || 0;
        const storageCapacity = modules['retrofit-storage']?.params?.capacity || 0;

        if (projectBaseInfo.type === 'school' && projectBaseInfo.schoolType) {
            const region = ['Shanghai', 'Guangdong', 'Zhejiang'].includes(projectBaseInfo.province) ? 'south' : 'central';
            const result = calculateCampusConsumptionRate({
                schoolType: projectBaseInfo.schoolType,
                pvCapacity: totalCapacity,
                storageCapacity: storageCapacity,
                hasAirConditioning: projectBaseInfo.hasAirConditioning ?? true,
                region,
                considerWeekends: true,
                considerVacations: true
            });
            setConsumptionResult(result);
            setCalculatedSelfConsumption(Math.round(result.recommendedRate * 100));
        } else {
            if (bills.length > 0) {
                const totalKwh = bills.reduce((sum, b) => sum + b.kwh, 0);
                const avgMonthly = totalKwh / 12;
                const estimatedYearlyGeneration = totalCapacity * params.advParams.dailySunHours * params.advParams.generationDays * (params.advParams.prValue / 100);
                const rate = Math.min(100, (avgMonthly * 12 / estimatedYearlyGeneration) * 100);
                setCalculatedSelfConsumption(Math.round(rate || 85));
                setConsumptionResult(null);
            } else {
                setCalculatedSelfConsumption(85);
                setConsumptionResult(null);
            }
        }
    }, [selfUseMode, projectBaseInfo, params.simpleParams.capacity, params.advParams.dailySunHours, params.advParams.generationDays, params.advParams.prValue, bills, modules]);

    return {
        currentModule,
        params,
        handleUpdate,
        buildings,
        setBuildings,
        selfUseMode,
        setSelfUseMode,
        calculatedSelfConsumption,
        setCalculatedSelfConsumption,
        consumptionResult,
        toggleModule,
        saveProject,
        transformers,
        bills,
        projectBaseInfo,
        priceConfig,
        storageModule: modules['retrofit-storage']
    };
};

export const useSolarMetrics = (params: SolarParamsState, selfRate: number, bills: any[], projectBaseInfo: any) => {
    const chartData = useMemo(() => {
        // 默认权重曲线 (之前是硬编码)
        const baseWeights = [3.2, 3.5, 4.1, 4.8, 5.5, 5.2, 5.8, 5.6, 4.9, 4.5, 3.8, 3.3];

        // 如果有 NASA 的逐月数据，则使用 NASA 的权重分布
        const hasNasaMonthly = projectBaseInfo.nasaMonthlyHours && projectBaseInfo.nasaMonthlyHours.length === 12;
        const weights = hasNasaMonthly ? projectBaseInfo.nasaMonthlyHours : baseWeights;

        const capacity = params.simpleParams.capacity || 400;
        const totalWeight = weights.reduce((a: number, b: number) => a + b, 0);

        // 计算首年理论总发电量 (万度)
        const totalGenYear1 = capacity * params.advParams.dailySunHours * params.advParams.generationDays
            * (params.advParams.prValue / 100) * (params.advParams.azimuthEfficiency / 100) / 10000;

        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

        return months.map((m, i) => {
            const bill = bills.find(b => b.month === m || b.month === `${i + 1}月`);
            const consumption = bill ? bill.kwh / 10000 : 0; // 转换为万度

            // 根据月度权重分配总电量
            const monthlyGen = totalGenYear1 * (weights[i] / totalWeight);

            return {
                name: m,
                retrofit: parseFloat(monthlyGen.toFixed(2)),
                consumption: parseFloat(consumption.toFixed(2))
            };
        });
    }, [params.simpleParams.capacity, params.advParams, bills, projectBaseInfo.nasaMonthlyHours]);

    const longTermMetrics = useMemo(() => {
        const capacity = params.simpleParams.capacity || 0;
        const investment = capacity * params.simpleParams.epcPrice / 10;
        const roofRentIncome = params.simpleParams.area * params.advParams.roofRent / 10000; // 万元/年
        const details: any[] = [];
        const cashFlows = [-investment];

        let accumulatedDepreciation = 0;
        let vatCarryForward = investment - (investment / (1 + (projectBaseInfo?.vatRate ?? 13.0) / 100));

        let cumulativeNet = -investment;
        let paybackYear = -1;

        for (let year = 1; year <= 25; year++) {
            const degradation = year === 1 ?
                (1 - params.advParams.degradationFirstYear / 100) :
                (1 - params.advParams.degradationFirstYear / 100) * Math.pow(1 - params.advParams.degradationLinear / 100, year - 1);

            const generation = capacity * params.advParams.dailySunHours * params.advParams.generationDays
                * (params.advParams.prValue / 100) * (params.advParams.azimuthEfficiency / 100) * degradation / 10000;

            const selfUseGen = generation * (selfRate / 100);
            const gridGen = generation * (1 - selfRate / 100);

            const totalSelfUseRevenue = selfUseGen * params.advParams.electricityPrice;
            const gridRevenue = gridGen * params.advParams.feedInTariff;

            let investorRevenue = 0;
            let ownerBenefit = 0;

            if (params.simpleParams.investmentMode === 'emc') {
                if (params.simpleParams.emcSubMode === 'sharing') {
                    const ownerShare = params.advParams.emcOwnerShareRate / 100;
                    ownerBenefit = totalSelfUseRevenue * ownerShare + roofRentIncome;
                    investorRevenue = totalSelfUseRevenue * (1 - ownerShare) + gridRevenue - roofRentIncome;
                } else {
                    const discountRevenue = selfUseGen * params.advParams.emcDiscountPrice;
                    ownerBenefit = selfUseGen * (params.advParams.electricityPrice - params.advParams.emcDiscountPrice) + roofRentIncome;
                    investorRevenue = discountRevenue + gridRevenue - roofRentIncome;
                }
            } else {
                investorRevenue = totalSelfUseRevenue + gridRevenue;
                ownerBenefit = investorRevenue;
            }

            const taxRate = projectBaseInfo?.taxRate ?? 5.0;
            const vatRate = projectBaseInfo?.vatRate ?? 13.0;
            const vatExtraRate = projectBaseInfo?.vatExtraRate ?? 6.0;
            const insuranceRate = projectBaseInfo?.insuranceRate ?? 0.35;

            // Separate OPEX
            const baseOpex = capacity * params.advParams.omCost / 10;
            const insurance = investment * (insuranceRate / 100);
            const totalOpex = baseOpex + insurance;

            // DDB Depreciation
            const investmentNet = investment / (1 + vatRate / 100);
            let dp = 0;
            if (year <= 8) {
                dp = (investmentNet - accumulatedDepreciation) * (2 / 10);
                accumulatedDepreciation += dp;
            } else if (year === 9 || year === 10) {
                const remaining = investmentNet - accumulatedDepreciation;
                dp = remaining / 2;
            }

            // VAT Math
            const revenueNet = investorRevenue / (1 + vatRate / 100);
            const outputVat = investorRevenue - revenueNet;
            const opexInputVat = totalOpex * 0.05; // standard assumption

            let vatPayable = outputVat - opexInputVat - vatCarryForward;
            if (vatPayable < 0) {
                vatCarryForward = -vatPayable;
                vatPayable = 0;
            } else {
                vatCarryForward = 0;
            }

            const vatSurcharge = vatPayable * (vatExtraRate / 100);

            // Income Tax
            const taxableIncome = revenueNet - totalOpex - dp - vatSurcharge;
            const incomeTax = taxableIncome > 0 ? taxableIncome * (taxRate / 100) : 0;

            const netIncome = investorRevenue - totalOpex - vatPayable - vatSurcharge - incomeTax;

            details.push({
                year,
                generation: parseFloat(generation.toFixed(2)),
                revenue: parseFloat(investorRevenue.toFixed(2)),
                ownerBenefit: parseFloat(ownerBenefit.toFixed(2)),
                opex: parseFloat(totalOpex.toFixed(2)),
                om: parseFloat(baseOpex.toFixed(2)),
                insurance: parseFloat(insurance.toFixed(2)),
                tax: parseFloat((vatPayable + vatSurcharge + incomeTax).toFixed(2)),
                incomeTax: parseFloat(incomeTax.toFixed(2)),
                netIncome: parseFloat(netIncome.toFixed(2))
            });

            cashFlows.push(parseFloat(netIncome.toFixed(2)));
            cumulativeNet += netIncome;
            if (paybackYear === -1 && cumulativeNet >= 0) {
                paybackYear = year - (cumulativeNet / netIncome);
            }
        }

        const rev25Year = details.reduce((sum: number, d: any) => sum + d.netIncome, 0);
        const totalOwnerBenefit25 = details.reduce((sum: number, d: any) => sum + d.ownerBenefit, 0);

        // 统一 25 年期标准 IRR 与回本周期 (Phase 10)
        // 使用首年毛收益进行 25 年现金流推演
        const firstYearInvestorRevenue = details.length > 0 ? details[0].revenue : 0;
        const stdCashFlows = generateStandardCashFlows({
            totalInvestment: investment,
            totalGrossSaving: firstYearInvestorRevenue,
            omRate: (capacity * params.advParams.omCost / 10) / investment * 100,
            taxRate: projectBaseInfo?.taxRate ?? 5.0,
            vatRate: projectBaseInfo?.vatRate ?? 13.0,
            vatExtraRate: projectBaseInfo?.vatExtraRate ?? 1.56,
            period: 25
        });
        const stdIrr = calculateIRR(stdCashFlows);
        const stdPayback = calculatePaybackPeriod(stdCashFlows);

        return {
            genYear1: details.length > 0 ? details[0].generation : 0,
            rev25Year: parseFloat(rev25Year.toFixed(2)),
            totalOwnerBenefit25: parseFloat(totalOwnerBenefit25.toFixed(2)),
            irr: stdIrr,
            paybackPeriod: stdPayback,
            cashFlows: stdCashFlows,
            yearlyDetails: details,
            // 上报给全局的 reportedSaving 必须是【毛收益 - 运维费】(税前)
            reportedSaving: firstYearInvestorRevenue - (capacity * params.advParams.omCost / 10)
        };
    }, [params, selfRate, projectBaseInfo?.omRate]);

    return { chartData, longTermMetrics };
};
