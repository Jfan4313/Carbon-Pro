export interface HvacStrategy {
    name: string;
    targetSCOP: number; // Expert: Replaced targetCOP with targetSCOP
    unitCost: number; // 元/kW (Cooling Load)
}

export interface HvacGlobalParams {
    electricityPrice: number;
    gasPrice: number; // 元/m3 (For CCHP)
    currentAvgCOP: number; // Keep for backward compatibility if needed
    baseSystemSCOP: number; // EXPERT: Realistic baseline system SCOP
    avgLoadFactor: number; // EXPERT: Average loading factor (e.g., 0.6)
    discountRate: number;
    maintenanceGrowth: number;
    investmentMode: 'self' | 'emc';
    emcOwnerShareRate: number;
    // Expert Parameters
    aiGainFactor: number; // AI 系统带来的二次优化 (1.0~1.2)
    occupancyFactor: number; // 入驻率修正 (0.1~1.0)
    climateAdjust: number; // 度日数/气象修正因子 (0.8~1.2)
    // Detailed Costs
    hardwareCost: number; // 主机/水泵硬件 (万)
    installCost: number;  // BIMS/安装工程 (万)
    systemCost: number;   // 智控/数字孪生 (万)
    auxCost: number;      // 冷却塔/辅材其他 (万)
}

export interface HvacBuilding {
    id: number;
    name: string;
    desc: string;
    load: number;
    area: number;
    active: boolean;
    strategy: string; // 'basic' | 'intermediate' | 'advanced' | 'cchp'
    runHours: number;
    costMode: 'power' | 'area' | 'fixed';
    customUnitCost: number;
    customTotalInvest: number;
    customCOP: number;
}

export interface HvacSchedule {
    start: number;
    end: number;
}

export interface HvacFinancials {
    totalInvestment: number;
    totalYearlySaving: number;
    ownerBenefit: number;
    investorRevenue: number;
    cchpGasCost: number;
    irr: number;
    paybackPeriod: number;
    cashFlows: number[];
    yearlyDetails?: any[];
}
