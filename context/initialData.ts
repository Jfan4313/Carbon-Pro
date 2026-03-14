import { ModuleData, PriceConfigState, ProjectBaseInfo } from './ProjectContext';

export const initialModules: Record<string, ModuleData> = {
    'retrofit-solar': {
        id: 'retrofit-solar',
        name: '分布式光伏',
        isActive: true,
        strategy: 'rooftop',
        investment: 165.0,
        yearlySaving: 38.8,
        kpiPrimary: { label: '装机容量', value: '450 kW' },
        kpiSecondary: { label: 'ROI', value: '23.5%' }
    },
    'retrofit-storage': {
        id: 'retrofit-storage',
        name: '工商业储能',
        isActive: true,
        strategy: 'arbitrage',
        investment: 300.0,
        yearlySaving: 88.5,
        kpiPrimary: { label: '配置容量', value: '2 MWh' },
        kpiSecondary: { label: '回收期', value: '3.4 年' }
    },
    'retrofit-hvac': {
        id: 'retrofit-hvac',
        name: '暖通空调',
        isActive: true,
        strategy: 'full_retrofit',
        investment: 50.0,
        yearlySaving: 35.0,
        kpiPrimary: { label: '年节电费用', value: '35.0 万元' },
        kpiSecondary: { label: '回本周期', value: '1.4 年' }
    },
    'retrofit-lighting': {
        id: 'retrofit-lighting',
        name: '智能照明',
        isActive: true,
        strategy: 'smart',
        investment: 25.0,
        yearlySaving: 12.5,
        kpiPrimary: { label: '灯具数量', value: '1800 盏' },
        kpiSecondary: { label: '回收期', value: '2.0 年' }
    },
    'retrofit-water': {
        id: 'retrofit-water',
        name: '热水系统',
        isActive: false,
        strategy: 'heatpump',
        investment: 40.0,
        yearlySaving: 18.0,
        kpiPrimary: { label: '日供水', value: '80 吨' },
        kpiSecondary: { label: '回收期', value: '2.2 年' }
    },
    'retrofit-ev': {
        id: 'retrofit-ev',
        name: '充电桩设施',
        isActive: false,
        strategy: 'smart',
        investment: 70.0,
        yearlySaving: 36.5,
        kpiPrimary: { label: '桩体数量', value: '12 个' },
        kpiSecondary: { label: '收益率', value: '38.5%' }
    },
    'retrofit-microgrid': {
        id: 'retrofit-microgrid',
        name: '微电网',
        isActive: false,
        strategy: 'grid-tied',
        investment: 40.0,
        yearlySaving: 0,
        kpiPrimary: { label: 'PCC容量', value: '2500 kVA' },
        kpiSecondary: { label: '可靠性', value: '99.9%' }
    },
    'retrofit-vpp': {
        id: 'retrofit-vpp',
        name: '虚拟电厂',
        isActive: false,
        strategy: 'dr',
        investment: 10.0,
        yearlySaving: 13.5,
        kpiPrimary: { label: '调节容量', value: '500 kW' },
        kpiSecondary: { label: '响应时间', value: '分钟级' }
    },
    'retrofit-ai': {
        id: 'retrofit-ai',
        name: 'AI 智控平台',
        isActive: true,
        strategy: 'ai',
        investment: 35.0,
        yearlySaving: 20.0,
        kpiPrimary: { label: '接入点位', value: '2000 个' },
        kpiSecondary: { label: '额外节能', value: '8.5%' }
    },
    'retrofit-carbon': {
        id: 'retrofit-carbon',
        name: '碳资产管理',
        isActive: true,
        strategy: 'trade',
        investment: 0,
        yearlySaving: 4.9,
        kpiPrimary: { label: '年减排', value: '580 t' },
        kpiSecondary: { label: '碳价', value: '85 元/t' }
    },
    'retrofit-management': {
        id: 'retrofit-management',
        name: '综合能源管理',
        isActive: true,
        strategy: 'standard',
        investment: 0,
        yearlySaving: -5.0, // 默认支出
        kpiPrimary: { label: '托管运维', value: '5.0 万元/年' },
        kpiSecondary: { label: '服务费率', value: '0%' },
        params: {
            extraOmCost: 5.0,
            platformFeeRate: 0,
            mode: 'fixed'
        }
    }
};

export const initialPriceConfig: PriceConfigState = {
    mode: 'tou',
    fixedPrice: 0.85,
    templateId: 'shanghai_10kv',
    hasSummer: true,
    summerMonths: [7, 8, 9],
    touSegments: [
        { start: 0, end: 6, price: 0.32, type: 'valley' },
        { start: 6, end: 8, price: 0.68, type: 'flat' },
        { start: 8, end: 11, price: 1.15, type: 'peak' },
        { start: 11, end: 13, price: 0.68, type: 'flat' },
        { start: 13, end: 15, price: 1.15, type: 'peak' },
        { start: 15, end: 18, price: 0.68, type: 'flat' },
        { start: 18, end: 21, price: 1.15, type: 'peak' },
        { start: 21, end: 22, price: 0.68, type: 'flat' },
        { start: 22, end: 24, price: 0.32, type: 'valley' }
    ],
    summerTouSegments: [
        { start: 0, end: 6, price: 0.35, type: 'valley' },
        { start: 6, end: 8, price: 0.72, type: 'flat' },
        { start: 8, end: 11, price: 1.25, type: 'peak' },
        { start: 11, end: 12, price: 0.72, type: 'flat' },
        { start: 12, end: 14, price: 1.75, type: 'tip' },
        { start: 14, end: 15, price: 1.25, type: 'peak' },
        { start: 15, end: 18, price: 0.72, type: 'flat' },
        { start: 18, end: 21, price: 1.25, type: 'peak' },
        { start: 21, end: 22, price: 0.72, type: 'flat' },
        { start: 22, end: 24, price: 0.35, type: 'valley' }
    ],
    spotPrices: Array(24).fill(0.5)
};

export const initialProjectBaseInfo: ProjectBaseInfo = {
    name: '上海浦东新区工业园节能改造项目',
    type: 'factory',
    province: 'Shanghai',
    city: 'Pudong',
    buildings: [],
    omRate: 1.0, // Default 1.0% O&M
    insuranceRate: 0.35, // Default 0.35% for Insurance
    taxRate: 5.0, // Default to 5.0% for small/micro enterprises
    vatRate: 13.0, // Default 13% Value Added Tax
    vatExtraRate: 6.0, // Default 6% VAT surcharges (Urban Construction + Education) at 50% discount for small/micro
    discountRate: 5.0,
    spvConfig: {
        debtRatio: 70, // 70% loan
        loanInterest: 4.5, // 4.5% interest
        loanTerm: 10, // 10 years
        shareholderARate: 51 // 51% shareholder A
    }
};
