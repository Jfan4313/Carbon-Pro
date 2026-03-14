export interface StorageBasicParams {
    power: number; // kW
    capacity: number; // kWh
    unitCost: number; // 元/kWh
}

export interface StorageAdvParams {
    dod: number; // %
    rte: number; // % (Round-Trip Efficiency)
    cycles: number;
    degradation: number; // % per year
    auxPower: number; // kW (Auxiliary power for cooling/BMS)
}

export interface StorageAiFeatures {
    dynamicPricing: boolean;
    demandManagement: boolean;
    pvSelfConsumption: boolean;
}

export interface StorageInvestmentConfig {
    mode: 'self' | 'emc';
    emcOwnerShareRate: number;
    // Detailed Costs
    hardwareCost: number; // 动力电池/电芯 (万)
    pcsCost: number;      // PCS/变流器 (万)
    systemCost: number;   // BMS/EMS/消防 (万)
    civilCost: number;    // 施工/并网/辅材 (万)
}

export interface StorageFinancials {
    investment: number;
    arbitrage: number;
    demand: number;
    totalSaving: number;
    ownerBenefit: number;
    investorRevenue: number;
    payback: number;
    irr: number;
    yearlyDetails?: any[];
}

export interface StorageSimulationData {
    hour: string;
    price: number;
    load: number;
    pv: number;
    action: number;
    gridLoad: number;
    transformerLimit: number;
}
