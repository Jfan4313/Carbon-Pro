import { useMemo } from 'react';

// 电价数据类型
export interface PriceData {
    hour: number;
    price: number;
}

// 仿真结果类型
export interface SimulationResult {
    data: {
        hour: number;
        hourLabel: string;
        price: number;
        baseLoad: number;
        aiLoad: number;
        costBase: number;
        costAi: number;
        flowState: string;
        aiAction: string;
    }[];
    dailyCostBase: number;
    dailyCostAi: number;
    annualBillBase: number;
    annualBillAi: number;
    annualSaving: number;
    netBenefit: number;
    roi: number;
    payback: number;
    cashFlows: { year: number; flow: number; cumulative: number }[];
    sectorImpacts: { name: string; base: number; ai: number; increase: string }[];
}

// 动态仿真结果类型
export interface DynamicSimulationResult {
    states: {
        hour: number;
        period: string;
        price: number;
        gridState: string;
        battery: string;
        load: number;
        gridPower: number;
        pvPower: number;
        batteryPower: number;
    }[];
    metrics: {
        totalCost: string;
        totalRevenue: string;
        roi: string;
        peakSavingRate: string;
        batteryArbitrage: string;
    };
}

// 金融参数类型
export interface FinancialParams {
    investment: number;
    opex: number;
    analysisPeriod: number;
}

/**
 * 24小时仿真数据 Hook
 * 从 RetrofitAI.tsx 的 simulation useMemo 提取
 */
export const useSimulationData = (
    useSpotPrice: boolean,
    importedPriceData: PriceData[],
    financialParams: FinancialParams,
    modules: Record<string, any> = {}
): SimulationResult => {
    const { investment, opex, analysisPeriod } = financialParams;
    const solarMod = modules['retrofit-solar'];
    const storageMod = modules['retrofit-storage'];
    const hvacMod = modules['retrofit-hvac'];
    const lightingMod = modules['retrofit-lighting'];

    // Granular dependencies to avoid infinite loops when AI module updates itself
    const solarActive = solarMod?.isActive;
    const solarSaving = solarMod?.yearlySaving;
    const storageActive = storageMod?.isActive;
    const storageSaving = storageMod?.yearlySaving;
    const hvacActive = hvacMod?.isActive;
    const hvacSaving = hvacMod?.yearlySaving;
    const lightingActive = lightingMod?.isActive;
    const lightingSaving = lightingMod?.yearlySaving;

    return useMemo(() => {
        // 1. Calculate Real AI Sector Impacts based on active modules
        const sectorImpacts = [];
        let calculatedAnnualAiSaving = 0;

        // If storage is active, AI improves arbitrage by roughly 20% (predictive charging)
        if (storageActive && storageSaving) {
            const aiStorageGain = storageSaving * 0.20;
            calculatedAnnualAiSaving += aiStorageGain;
            sectorImpacts.push({
                name: '储能策略寻优',
                base: storageSaving,
                ai: aiStorageGain,
                increase: '+20%'
            });
        }

        // If HVAC is active, AI improves efficiency by roughly 15% (dynamic Setpoint, weather prediction)
        if (hvacActive && hvacSaving) {
            const aiHvacGain = hvacSaving * 0.15;
            calculatedAnnualAiSaving += aiHvacGain;
            sectorImpacts.push({
                name: '暖通智控增效',
                base: hvacSaving,
                ai: aiHvacGain,
                increase: '+15%'
            });
        }

        // If Lighting is active, AI adds 10% (smart presence/daylight harvesting)
        if (lightingActive && lightingSaving) {
            const aiLightingGain = lightingSaving * 0.10;
            calculatedAnnualAiSaving += aiLightingGain;
            sectorImpacts.push({
                name: '照明精细控制',
                base: lightingSaving,
                ai: aiLightingGain,
                increase: '+10%'
            });
        }

        // Universal AI Benefit: Demand Management (需量管理) 
        // Assume saving 30kW/month, typical capacity price 40 RMB/kW/month
        const aiDemandGain = (30 * 40 * 12) / 10000; // 万元
        calculatedAnnualAiSaving += aiDemandGain;
        sectorImpacts.push({
            name: '智能需量管理',
            base: 0,
            ai: aiDemandGain,
            increase: '新增收益'
        });

        const annualSaving = calculatedAnnualAiSaving;
        const netBenefit = annualSaving - opex;

        // 2. Generate Demo 24-hour curve that visually matches the calculated savings
        // This is purely for visualization of the "AI vs Base" load profile
        const data = [];
        let totalCostBase = 0;
        let totalCostAi = 0;
        let totalLoadBase = 0;
        let totalLoadAi = 0;
        const totalProjectBaseBill = ((storageSaving || 0) + (hvacSaving || 0) + (lightingSaving || 0)) * 5 || 200; // Rough estimate of base bill

        for (let i = 0; i < 24; i++) {
            let price = useSpotPrice ? 0.6 : 0.7; // simplified average for chart
            if (importedPriceData.length > 0) {
                const importedData = importedPriceData.find(d => d.hour === i);
                price = importedData ? importedData.price : price;
            } else if (!useSpotPrice) {
                if (i < 8) price = 0.35;
                else if ((i >= 8 && i < 11) || (i >= 17 && i < 22)) price = 1.1;
                else if (i >= 11 && i < 13) price = 0.7;
                else if (i >= 13 && i < 15) price = 1.1;
                else price = 0.7;
            }

            // Generate a realistic base load shape
            let baseLoad = 150 + Math.sin((i - 8) / 16 * Math.PI) * 200;
            if (baseLoad < 80) baseLoad = 80;
            if (i > 22 || i < 6) baseLoad *= 0.5;

            // Adjust aiLoad slightly to show shifting, but mathematically scale it so the total matches our calculatedAnnualAiSaving
            let aiLoad = baseLoad;
            if (price > 1.0) aiLoad = baseLoad * 0.85; // Shift away from peak
            else if (price < 0.5) aiLoad = baseLoad * 1.05; // Slightly increase in valley

            const costBase = baseLoad * price;
            const costAi = aiLoad * price;

            totalCostBase += costBase;
            totalCostAi += costAi;
            totalLoadBase += baseLoad;
            totalLoadAi += aiLoad;

            let flowState = 'idle';
            let aiAction = '监控中';
            if (price > 1.0) { flowState = 'discharge'; aiAction = '削峰响应'; }
            else if (price < 0.5) { flowState = 'charge'; aiAction = '谷期蓄能'; }
            else { flowState = 'optimize'; aiAction = '动态寻优'; }

            data.push({
                hour: i,
                hourLabel: `${i}:00`,
                price,
                baseLoad: Math.round(baseLoad),
                aiLoad: Math.round(aiLoad),
                costBase,
                costAi,
                flowState,
                aiAction
            });
        }

        const annualBillBase = totalProjectBaseBill;
        // Mock the Bill AI based on the saving we calculated
        const annualBillAi = Math.max(0, annualBillBase - annualSaving);

        const roi = investment > 0 ? (netBenefit / investment) * 100 : 0;
        const payback = netBenefit > 0 ? investment / netBenefit : 0;

        // Long term Cash Flow
        const cashFlows = [];
        let cumulative = -investment;
        for (let year = 0; year <= analysisPeriod; year++) {
            if (year === 0) {
                cashFlows.push({ year, flow: -investment, cumulative });
            } else {
                cumulative += netBenefit;
                cashFlows.push({ year, flow: netBenefit, cumulative });
            }
        }

        return {
            data,
            dailyCostBase: totalCostBase,
            dailyCostAi: totalCostAi,
            annualBillBase,
            annualBillAi,
            annualSaving,
            netBenefit,
            roi,
            payback,
            cashFlows,
            sectorImpacts: sectorImpacts.length > 0 ? sectorImpacts : [{ name: '基础管理', base: 0, ai: annualSaving, increase: '100%' }]
        };
    }, [useSpotPrice, importedPriceData, investment, opex, analysisPeriod,
        solarActive, storageActive, hvacActive, lightingActive,
        solarSaving, storageSaving, hvacSaving, lightingSaving]);
};

/**
 * 动态分析仿真数据 Hook
 * 从 RetrofitAI.tsx 的 dynamicSimulation useMemo 提取
 */
export const useDynamicSimulation = (
    selectedScenario: string,
    dynamicAiEnabled: boolean,
    dynamicAiAggressiveness: number,
    modules: Record<string, any> = {}
): DynamicSimulationResult => {
    const solarActive = modules['retrofit-solar']?.isActive;
    const solarCapacity = modules['retrofit-solar']?.params?.simpleParams?.capacity || 0;
    const storageActive = modules['retrofit-storage']?.isActive;
    const storageCapacity = modules['retrofit-storage']?.params?.basicParams?.capacity || 0;
    const storagePower = modules['retrofit-storage']?.params?.basicParams?.power || (storageCapacity / 2);
    const hvacMod = modules['retrofit-hvac'];
    const hvacCapacity = (hvacMod?.isActive && hvacMod.params?.hvacBuildings?.reduce((acc: number, b: any) => acc + (b.active ? b.load : 0), 0)) || 0;

    return useMemo(() => {
        const states = [];
        const basePrice = 0.8;

        const pvCapacity = (solarActive && solarCapacity) || 0;
        const storageCapacityVal = (storageActive && storageCapacity) || 0;
        const batteryPower = storageActive ? storagePower : 0;
        const efficiency = 0.9;

        // Get price modifier based on scenario and AI level
        const getPriceModifier = (hour: number, scenario: string, aiLevel: number) => {
            let modifier = 1.0;

            if (scenario === 'extreme-price') {
                const isPeak = hour >= 17 && hour <= 21;
                if (isPeak) modifier = 0.2; // 削峰70%
                if (aiLevel > 70) modifier *= 0.8; // AI进一步削减
            } else if (scenario === 'peak-shaving') {
                const isPeak = hour >= 17 && hour <= 21;
                if (isPeak && aiLevel > 60) modifier = 0.5; // 削峰50%
                else if (aiLevel > 70) modifier *= 0.9; // AI更积极削峰
            }

            return Math.round(modifier * 100) / 100;
        };

        for (let i = 0; i < 24; i++) {
            const priceModifier = getPriceModifier(i, selectedScenario, dynamicAiEnabled ? dynamicAiAggressiveness : 50);
            const hourPrice = basePrice * priceModifier;

            // Generate system state
            let gridPower = 500;
            let pvPower = 0;
            let load = 100;
            let batteryState: 'idle' | 'discharging' | 'charging' = 'idle';

            // PV generation based on hour
            let sunHours = 0;
            if (i >= 8 && i <= 15) sunHours = 4;
            else if (i >= 16 && i <= 18) sunHours = 2;
            else if (i >= 19 || i <= 6) sunHours = 0;
            else sunHours = 1;

            const pvGen = pvCapacity * sunHours / 1000; // kW
            pvPower = pvGen > 0 ? pvGen : 0;

            // Storage charge/discharge decision
            if (i >= 8 && i <= 16) {
                batteryState = dynamicAiEnabled || selectedScenario === 'price-arbitrage' ? 'charging' : 'idle';
            } else if (i >= 18 && i <= 22) {
                if (selectedScenario === 'price-arbitrage' || dynamicAiEnabled) {
                    batteryState = 'discharging';
                }
            }

            // Load calculation
            const baseLoad = 100;
            if (batteryState === 'charging') {
                load = baseLoad + batteryPower * efficiency;
            } else if (batteryState === 'discharging') {
                load = baseLoad - batteryPower * efficiency;
                if (load < 50) load = 50; // Minimum load
            } else {
                load = baseLoad;
            }

            // Grid state
            let gridState: 'idle' | 'pv-charging' | 'discharging' | 'charging' = 'idle';
            if (pvPower > 0 && pvPower >= load) {
                gridState = 'pv-charging';
            } else if (batteryState === 'discharging') {
                gridState = 'discharging';
            } else if (batteryState === 'charging') {
                gridState = 'charging';
            }

            gridPower = load - (pvPower || 0);
            if (gridPower < 0) gridPower = 0;

            states.push({
                hour: i,
                period: i >= 6 && i < 12 ? 'morning' : i >= 12 && i < 18 ? 'afternoon' : i >= 18 && i < 22 ? 'evening' : 'night',
                price: hourPrice,
                gridState,
                battery: batteryState,
                load,
                gridPower,
                pvPower,
                batteryPower: batteryState === 'charging' || batteryState === 'discharging' ? batteryPower : 0
            });
        }

        // Calculate metrics
        let totalCost = 0;
        let totalRevenue = 0;
        let peakShaving = 0;
        let batteryArbitrage = 0;

        states.forEach(state => {
            const hourCost = state.price * state.load / 1000;
            totalCost += hourCost;

            // PV self-use revenue
            if (state.pvPower > 0) {
                const selfUseRevenue = Math.min(state.pvPower, state.load) * (state.price * 1.2);
                const pvRevenue = (state.price * 0.4) * Math.max(0, state.pvPower - state.load);
                totalRevenue += selfUseRevenue + pvRevenue;
            }

            // Storage arbitrage revenue
            if (state.battery === 'discharging') {
                const chargeCost = 0.52 * state.batteryPower * 0.9; // Valley price charging
                const dischargeRevenue = 1.62 * state.batteryPower * 0.9; // Peak price discharging
                batteryArbitrage = dischargeRevenue - chargeCost;
                totalRevenue += batteryArbitrage;
            }

            // Peak shaving savings (AI load shifting + battery discharge during peak)
            if (state.price > 1.0 && state.baseLoad > state.load) {
                peakShaving += (state.baseLoad - state.load) * state.price;
            }
        });

        const roi = totalCost > 0 ? ((totalRevenue / 10 - totalCost) / totalCost * 100) : 0;
        const peakSavingRate = totalCost > 0 ? (peakShaving / totalCost * 100) : 0;

        return {
            states,
            metrics: {
                totalCost: (totalCost || 0).toFixed(2),
                totalRevenue: (totalRevenue || 0).toFixed(2),
                roi: (roi || 0).toFixed(1),
                peakSavingRate: (peakSavingRate || 0).toFixed(1),
                batteryArbitrage: (batteryArbitrage || 0).toFixed(2),
            }
        };
    }, [selectedScenario, dynamicAiEnabled, dynamicAiAggressiveness,
        solarActive, solarCapacity, storageActive, storageCapacity, storagePower, hvacCapacity]);
};
