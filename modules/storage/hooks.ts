import { useState, useEffect, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
    StorageBasicParams,
    StorageAdvParams,
    StorageAiFeatures,
    StorageInvestmentConfig,
    StorageSimulationData,
    StorageFinancials
} from './types';
import { generateStandardCashFlows, calculateIRR, calculatePaybackPeriod } from '../../utils/financial';

export function useStorageLogic() {
    const { modules, updateModule, toggleModule, priceConfig, transformers, bills, saveProject, projectBaseInfo } = useProject();
    const currentModule = modules['retrofit-storage'];
    const solarModule = modules['retrofit-solar'];

    const savedParams = currentModule.params || {};

    // Get O&M rate from global project context
    const omRate = projectBaseInfo?.omRate || 1.0;
    const insuranceRate = projectBaseInfo?.insuranceRate ?? 0.35;

    // --- State ---
    const [mode, setMode] = useState<'simple' | 'advanced'>(savedParams.mode || 'simple');
    const [isChartExpanded, setIsChartExpanded] = useState(false);

    const [basicParams, setBasicParams] = useState<StorageBasicParams>(savedParams.basicParams || {
        power: 100,
        capacity: 215,
        unitCost: 1200,
    });

    const [advParams, setAdvParams] = useState<StorageAdvParams>(savedParams.advParams || {
        dod: 90,
        rte: 88,
        cycles: 6000,
        degradation: 1.5,
        auxPower: 1.5,
    });

    const [strategyType, setStrategyType] = useState<'baseline' | 'ai'>(savedParams.strategyType || 'baseline');
    const [baselineMode, setBaselineMode] = useState<'2c2d' | '1c1d'>(savedParams.baselineMode || '2c2d');
    const [aiFeatures, setAiFeatures] = useState<StorageAiFeatures>(savedParams.aiFeatures || {
        dynamicPricing: true,
        demandManagement: true,
        pvSelfConsumption: false,
    });

    const [investmentConfig, setInvestmentConfig] = useState<StorageInvestmentConfig>(savedParams.investmentConfig || {
        mode: 'self',
        emcOwnerShareRate: 15,
        hardwareCost: 0,
        pcsCost: 0,
        systemCost: 0,
        civilCost: 0
    });

    const [marketPriceModel, setMarketPriceModel] = useState<'tou' | 'spot'>(savedParams.marketPriceModel || 'tou');

    // --- Mode Switching Logic ---
    useEffect(() => {
        if (mode === 'simple') {
            if (strategyType !== 'baseline' || baselineMode !== '2c2d') {
                setStrategyType('baseline');
                setBaselineMode('2c2d');
                setAiFeatures(prev => ({ ...prev, pvSelfConsumption: false, demandManagement: false }));
            }
        } else {
            if (!savedParams.aiFeatures && !aiFeatures.pvSelfConsumption) {
                const hasSolar = solarModule?.isActive && solarModule.kpiPrimary.value !== '0 kW';
                if (hasSolar && !aiFeatures.pvSelfConsumption) {
                    setAiFeatures(prev => ({ ...prev, pvSelfConsumption: true }));
                }
            }
        }
    }, [mode, solarModule, strategyType, baselineMode, aiFeatures.pvSelfConsumption, savedParams.aiFeatures]);

    // --- Environment calculations ---
    const totalTransformerCap = useMemo(() => {
        if (transformers.length > 0) {
            return transformers.reduce((acc, t) => acc + t.capacity, 0);
        }
        return 800;
    }, [transformers]);

    const maxHistoricalLoad = useMemo(() => {
        if (bills.length > 0) {
            const maxMonthKwh = Math.max(...bills.map(b => b.kwh));
            return Math.round((maxMonthKwh / 720) * 2.2);
        }
        return Math.round(totalTransformerCap * 0.6);
    }, [bills, totalTransformerCap]);

    const pvCapacity = useMemo(() => {
        if (solarModule && solarModule.isActive) {
            const match = solarModule.kpiPrimary.value.match(/(\d+(\.\d+)?)/);
            return match ? parseFloat(match[0]) : 0;
        }
        return 0;
    }, [solarModule]);

    const remainingCap = totalTransformerCap - maxHistoricalLoad;
    const isOverloadRisk = basicParams.power > remainingCap;

    // --- Simulation Logic ---
    const simulationData: StorageSimulationData[] = useMemo(() => {
        const data: StorageSimulationData[] = [];
        const { power } = basicParams;

        let hourlyPrices = Array(24).fill(0.8);
        if (marketPriceModel === 'spot') {
            hourlyPrices = [
                0.3, 0.3, 0.3, 0.3, 0.3, 0.4, 0.6, 0.8,
                0.5, 0.2, 0.1, 0.05, 0.05, 0.1, 0.2, 0.5,
                0.9, 1.2, 1.5, 1.8, 1.4, 0.8, 0.5, 0.4
            ];
        } else if (priceConfig.mode === 'tou') {
            priceConfig.touSegments.forEach(seg => {
                for (let h = seg.start; h < seg.end; h++) hourlyPrices[h] = seg.price;
            });
        } else if (priceConfig.mode === 'fixed') {
            hourlyPrices.fill(priceConfig.fixedPrice);
        }

        const baseLoadCurve = Array.from({ length: 24 }, (_, i) => {
            if (i < 8) return 50 + Math.random() * 10;
            if (i < 12) return 200 + Math.random() * 20;
            if (i < 14) return 150 + Math.random() * 20;
            if (i < 18) return 220 + Math.random() * 20;
            return 80 + Math.random() * 10;
        });

        const pvCurve = Array.from({ length: 24 }, (_, i) => {
            if (mode === 'simple' || !aiFeatures.pvSelfConsumption || pvCapacity === 0) return 0;
            const peak = pvCapacity * 0.75;
            if (i < 6 || i > 18) return 0;
            return peak * Math.exp(-Math.pow(i - 12, 2) / (2 * 4));
        });

        const chargeRate = power;

        for (let i = 0; i < 24; i++) {
            const price = hourlyPrices[i];
            const rawLoad = baseLoadCurve[i];
            const pv = pvCurve[i];
            const netLoadBeforeStorage = Math.max(0, rawLoad - pv);

            let storageAction = 0;

            if (mode === 'simple' || strategyType === 'baseline') {
                if (baselineMode === '2c2d' || mode === 'simple') {
                    if ((i >= 0 && i < 7) || (i >= 12 && i < 14)) storageAction = -chargeRate;
                    else if ((i >= 9 && i < 11) || (i >= 15 && i < 21)) storageAction = chargeRate;
                } else {
                    if (i >= 0 && i < 8) storageAction = -chargeRate;
                    else if ((i >= 9 && i < 12) || (i >= 15 && i < 20)) {
                        storageAction = chargeRate;
                    }
                }
            } else {
                const avgPrice = hourlyPrices.reduce((a, b) => a + b, 0) / 24;
                if (aiFeatures.pvSelfConsumption && pv > rawLoad) {
                    storageAction = -Math.min(chargeRate, pv - rawLoad);
                } else if (aiFeatures.demandManagement && netLoadBeforeStorage > 180) {
                    storageAction = Math.min(chargeRate, netLoadBeforeStorage - 180);
                } else if (aiFeatures.dynamicPricing) {
                    if (price < avgPrice * 0.6) storageAction = -chargeRate;
                    else if (price > avgPrice * 1.4) storageAction = chargeRate;
                }
            }

            data.push({
                hour: `${i}:00`,
                price: price,
                load: rawLoad,
                pv: pv,
                action: storageAction,
                gridLoad: Math.max(0, rawLoad - pv - storageAction),
                transformerLimit: totalTransformerCap
            });
        }
        return data;
    }, [basicParams, strategyType, baselineMode, aiFeatures, priceConfig, pvCapacity, totalTransformerCap, mode, marketPriceModel]);

    // Financial Metrics Calculation
    const financials: StorageFinancials = useMemo(() => {
        let investment = (basicParams.capacity * basicParams.unitCost) / 10000;

        // Use detailed costs if specified
        const detailedTotal = (investmentConfig.hardwareCost || 0) + (investmentConfig.pcsCost || 0) + (investmentConfig.systemCost || 0) + (investmentConfig.civilCost || 0);
        if (detailedTotal > 0) {
            investment = detailedTotal;
        }

        let dailyArbitrage = 0;
        simulationData.forEach(d => {
            const effFactor = mode === 'advanced' ? (advParams.rte / 100) : 1.0;
            if (d.action > 0) dailyArbitrage += d.action * d.price * effFactor;
            else dailyArbitrage += d.action * d.price;
        });

        const annualArbitrage = (dailyArbitrage * 330) / 10000;
        let annualDemandSaving = 0;

        if (mode === 'advanced' && strategyType === 'ai' && aiFeatures.demandManagement) {
            annualDemandSaving = (50 * 40 * 12) / 10000;
        }

        const totalYearlySaving = Math.max(0, annualArbitrage + annualDemandSaving);
        const isEmc = investmentConfig.mode === 'emc';
        const ownerShareRate = isEmc ? (investmentConfig.emcOwnerShareRate / 100) : 0;
        const ownerBenefit = totalYearlySaving * ownerShareRate;
        const investorRevenue = totalYearlySaving * (1 - ownerShareRate);

        // Update for standard 25 year cashflow modeling identical to solar / hvac 
        const taxRate = projectBaseInfo?.taxRate ?? 5.0;
        const vatRate = projectBaseInfo?.vatRate ?? 13.0;
        const vatExtraRate = projectBaseInfo?.vatExtraRate ?? 1.56;

        const firstYearGrossRevenue = totalYearlySaving;

        // Use exact local calc for 1st year snapshot (netInvestorRevenue = pretax)
        const annualOpex = investment * ((omRate + insuranceRate) / 100);
        const netInvestorRevenue = investorRevenue - annualOpex; // this was what storage previously used as "totalSaving"

        const dpYearly = investment * 0.95 / 20;
        const vat = investorRevenue * (vatRate / 100 / (1 + vatRate / 100));
        const vatSurcharge = vat * (vatExtraRate / 100);
        const taxableIncome = (investorRevenue - vat) - annualOpex - dpYearly - vatSurcharge;
        const incomeTax = taxableIncome > 0 ? taxableIncome * (taxRate / 100) : 0;
        const totalTax = vat + vatSurcharge + incomeTax;

        const netIncomeReal = investorRevenue - annualOpex - totalTax;

        // Pass to standard IRR calculator to stay perfectly synced with rest of app
        const stdCashFlows = generateStandardCashFlows({
            totalInvestment: investment,
            totalGrossSaving: investorRevenue,
            omRate: omRate,
            insuranceRate: insuranceRate,
            taxRate: projectBaseInfo?.taxRate ?? 5.0,
            vatRate: projectBaseInfo?.vatRate ?? 13.0,
            vatExtraRate: projectBaseInfo?.vatExtraRate ?? 1.56,
            period: 25
        });

        const irr = investment > 0 ? calculateIRR(stdCashFlows) : 0;
        const stdPayback = calculatePaybackPeriod(stdCashFlows);

        // Detailed 25-yr Projection Array
        const yearlyDetails = [];
        let accumulatedDepreciation = 0;
        let vatCarryForward = investment - (investment / (1 + vatRate / 100));

        for (let year = 1; year <= 25; year++) {
            const degradation = year === 1 ? 1 : Math.pow(1 - (advParams.degradation || 0) / 100, year - 1);
            const currentYearGross = investorRevenue * degradation;
            const currentOwnerBenefit = ownerBenefit * degradation;

            const baseOpex = investment * (omRate / 100);
            const insurance = investment * (insuranceRate / 100);
            const totalOpex = baseOpex + insurance;

            const investmentNet = investment / (1 + vatRate / 100);
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
                ownerBenefit: parseFloat(currentOwnerBenefit.toFixed(2)),
                opex: parseFloat(totalOpex.toFixed(2)),
                om: parseFloat(baseOpex.toFixed(2)),
                insurance: parseFloat(insurance.toFixed(2)),
                tax: parseFloat((vatPayable + vatSurcharge + incTax).toFixed(2)),
                incomeTax: parseFloat(incTax.toFixed(2)),
                netIncome: parseFloat(netInc.toFixed(2))
            });
        }

        return {
            investment,
            arbitrage: Math.max(0, annualArbitrage),
            demand: annualDemandSaving,
            totalSaving: Math.max(0, netIncomeReal), // Report fully taxed true saving
            ownerBenefit,
            investorRevenue: investorRevenue,
            payback: stdPayback,
            irr: irr,
            yearlyDetails
        };
    }, [simulationData, basicParams, advParams, strategyType, aiFeatures, mode, investmentConfig, omRate, projectBaseInfo]);

    // Sync to Global Context
    useEffect(() => {
        const newParams = {
            mode,
            basicParams,
            advParams,
            strategyType,
            baselineMode,
            aiFeatures,
            investmentConfig,
            marketPriceModel
        };

        const currentStoredParams = JSON.stringify(currentModule.params);
        if (JSON.stringify(newParams) !== currentStoredParams) {
            updateModule('retrofit-storage', {
                params: newParams,
                investment: financials.investment,
                yearlySaving: financials.totalSaving,
                kpiPrimary: { label: '装机规模', value: `${basicParams.power}kW/${basicParams.capacity}kWh` },
                kpiSecondary: { label: '套利收益', value: `¥${financials.arbitrage.toFixed(1)}万/年` },
                strategy: mode === 'advanced' ? (strategyType === 'ai' ? 'AI全局寻优' : '基础策略') : '标准策略',
            });
        }
    }, [
        mode, basicParams, advParams, strategyType, baselineMode, aiFeatures, investmentConfig, marketPriceModel,
        financials, currentModule.params, updateModule
    ]);

    return {
        // State
        mode, setMode,
        isChartExpanded, setIsChartExpanded,
        basicParams, setBasicParams,
        advParams, setAdvParams,
        strategyType, setStrategyType,
        baselineMode, setBaselineMode,
        aiFeatures, setAiFeatures,
        investmentConfig, setInvestmentConfig,
        marketPriceModel, setMarketPriceModel,
        // Computed
        totalTransformerCap,
        maxHistoricalLoad,
        remainingCap,
        isOverloadRisk,
        simulationData,
        financials,
        // Context Actions
        solarModule,
        saveProject,
        toggleModule,
        currentModule,
        projectBaseInfo,
        omRate
    };
}
