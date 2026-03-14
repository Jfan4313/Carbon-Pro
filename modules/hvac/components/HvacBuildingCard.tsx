import React from 'react';
import { HvacBuilding, HvacGlobalParams } from '../types';
import { STRATEGIES } from '../hooks';

interface HvacBuildingCardProps {
    building: HvacBuilding;
    mode: 'simple' | 'advanced';
    globalParams: HvacGlobalParams;
    toggleBuilding: (id: number) => void;
    updateBuildingRunHours: (id: number, val: number) => void;
    updateBuildingStrategy: (id: number, val: string) => void;
    updateBuildingSimpleField: (id: number, field: string, val: any) => void;
}

export const HvacBuildingCard: React.FC<HvacBuildingCardProps> = ({
    building: b,
    mode,
    globalParams,
    toggleBuilding,
    updateBuildingRunHours,
    updateBuildingStrategy,
    updateBuildingSimpleField
}) => {
    // EXPERT: Guard against stale keys
    let strategyKey = b.strategy;
    if (strategyKey === 'basic') strategyKey = 'vfd';
    if (strategyKey === 'intermediate') strategyKey = 'ai_control';
    if (strategyKey === 'advanced') strategyKey = 'full_retrofit';

    const strat = STRATEGIES[strategyKey as keyof typeof STRATEGIES] || STRATEGIES.vfd;
    // Determine effective values (override or default)
    const effSCOP = (mode === 'advanced' && b.customCOP > 0) ? b.customCOP : strat.targetSCOP;

    // Calc Invest based on mode
    let invest = 0;
    if (mode === 'simple') {
        invest = (b.load * strat.unitCost) / 10000;
    } else {
        if (b.costMode === 'fixed') {
            invest = b.customTotalInvest > 0 ? b.customTotalInvest : (b.load * strat.unitCost) / 10000;
        } else if (b.costMode === 'area') {
            const areaCost = b.customUnitCost > 0 ? b.customUnitCost : 200;
            invest = (b.area * areaCost) / 10000;
        } else {
            const powerCost = b.customUnitCost > 0 ? b.customUnitCost : strat.unitCost;
            invest = (b.load * powerCost) / 10000;
        }
    }

    let saving = 0;

    // EXPERT ALGORITHM: Sync with hooks.ts for precise estimation
    const adjustedBaseLoad = b.load * globalParams.occupancyFactor * globalParams.climateAdjust;
    const coolingLoadDemand = adjustedBaseLoad * b.runHours * globalParams.avgLoadFactor;
    const baselineElecCost = (coolingLoadDemand / globalParams.baseSystemSCOP * globalParams.electricityPrice) / 10000;

    if (b.strategy === 'cchp') {
        const equivalentElecNeeded = coolingLoadDemand / strat.targetSCOP;
        const gasNeededVolume = equivalentElecNeeded / 3.5;
        const gasCost = (gasNeededVolume * globalParams.gasPrice) / 10000;
        const extraElecGen = gasNeededVolume * 0.5;
        const extraElecValue = (extraElecGen * globalParams.electricityPrice) / 10000;
        saving = baselineElecCost - gasCost + extraElecValue;
    } else {
        const actualEffSCOP = (b.strategy === 'ai_control' || b.strategy === 'full_retrofit')
            ? effSCOP * globalParams.aiGainFactor
            : effSCOP;
        const newElecCost = (coolingLoadDemand / actualEffSCOP * globalParams.electricityPrice) / 10000;
        saving = baselineElecCost - newElecCost;
    }

    return (
        <div className={`flex flex-col rounded-xl border transition-all ${b.active ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
            {/* Header: Building Info & Estimates */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:px-6 lg:py-4 border-b border-slate-50">
                <div className="flex items-center gap-4">
                    <input
                        type="checkbox"
                        checked={b.active}
                        onChange={() => toggleBuilding(b.id)}
                        className="w-5 h-5 accent-primary cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-base">{b.name}</div>
                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                            <span>{b.desc}</span>
                            <span className="text-slate-300">|</span>
                            <span className="font-medium text-slate-700">{b.load} kW</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-400">原COP: {globalParams.currentAvgCOP || '无'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8 self-start sm:self-auto pl-9 sm:pl-0">
                    <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">预估投资</div>
                        <div className="text-[15px] font-black text-slate-800">¥ {(invest || 0).toFixed(1)} <span className="text-[10px] font-normal text-slate-500">万</span></div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-0.5">年综合节约</div>
                        <div className="text-[15px] font-black text-green-600">¥ {(saving || 0).toFixed(1)} <span className="text-[10px] font-normal text-green-500">万</span></div>
                    </div>
                </div>
            </div>

            {/* Controls: Hours & Strategies */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-6 p-4 lg:px-6 lg:py-5 bg-slate-50/50">
                <div className="flex items-center lg:flex-col lg:items-start shrink-0 lg:w-32 pl-9 lg:pl-0 gap-3 lg:gap-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                        <span className="material-icons text-[16px]">schedule</span> 年运行 (h)
                    </label>
                    <input
                        type="number"
                        value={b.runHours}
                        onChange={(e) => updateBuildingRunHours(b.id, parseFloat(e.target.value))}
                        className="w-28 lg:w-full px-3 py-2 text-sm text-center border border-slate-200 rounded-lg focus:border-primary outline-none bg-white font-bold text-slate-700 shadow-sm transition-colors"
                    />
                </div>

                <div className="flex-1 w-full pl-9 lg:pl-0">
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
                        {(['vfd', 'ai_control', 'full_retrofit', 'cchp'] as const).map((sKey) => {
                            const s = STRATEGIES[sKey];
                            const isSelected = b.strategy === sKey;
                            let colorClass = 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white shadow-sm';
                            if (isSelected && b.active) {
                                if (sKey === 'vfd') colorClass = 'bg-blue-50 border-blue-500 text-blue-700 font-bold ring-2 ring-blue-500/10 shadow-blue-100';
                                if (sKey === 'ai_control') colorClass = 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold ring-2 ring-emerald-500/10 shadow-emerald-100';
                                if (sKey === 'full_retrofit') colorClass = 'bg-purple-50 border-purple-500 text-purple-700 font-bold ring-2 ring-purple-500/10 shadow-purple-100';
                                if (sKey === 'cchp') colorClass = 'bg-orange-50 border-orange-500 text-orange-700 font-bold ring-2 ring-orange-500/10 shadow-orange-100';
                            }

                            return (
                                <button
                                    key={sKey}
                                    onClick={() => b.active && updateBuildingStrategy(b.id, sKey)}
                                    disabled={!b.active}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all min-h-[72px] ${colorClass}`}
                                >
                                    <span className="mb-1.5 leading-snug text-center px-1 font-bold text-xs">{s.name}</span>
                                    <div className="flex items-center gap-1 text-[10px] opacity-75 pt-2 border-t border-current/10 w-full justify-center">
                                        <span>SCOP</span>
                                        <span className="font-black text-[11px]">{s.targetSCOP}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Advanced Mode: Inline Customization */}
            {mode === 'advanced' && b.active && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/30 rounded-b-xl flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">精确估值参数微调</span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left: Performance */}
                        <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-3">
                                <label className="text-xs text-slate-500 whitespace-nowrap">目标 SCOP:</label>
                                <input
                                    type="number" step="0.1"
                                    value={b.customCOP || ''}
                                    placeholder={STRATEGIES[b.strategy as keyof typeof STRATEGIES].targetSCOP.toString()}
                                    onChange={(e) => updateBuildingSimpleField(b.id, 'customCOP', parseFloat(e.target.value))}
                                    className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded focus:border-primary outline-none bg-white font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        {/* Right: Cost Estimation Mode */}
                        <div className="flex-[2] bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-3">
                            {/* Mode Selector Tabs */}
                            <div className="flex gap-1 bg-slate-100 p-1 rounded text-[10px]">
                                <button
                                    onClick={() => updateBuildingSimpleField(b.id, 'costMode', 'power')}
                                    className={`flex-1 py-1.5 rounded transition-all ${b.costMode === 'power' ? 'bg-white text-primary shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    按冷负荷 (元/kW)
                                </button>
                                <button
                                    onClick={() => updateBuildingSimpleField(b.id, 'costMode', 'area')}
                                    className={`flex-1 py-1.5 rounded transition-all ${b.costMode === 'area' ? 'bg-white text-primary shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    按建筑面积 (元/㎡)
                                </button>
                                <button
                                    onClick={() => updateBuildingSimpleField(b.id, 'costMode', 'fixed')}
                                    className={`flex-1 py-1.5 rounded transition-all ${b.costMode === 'fixed' ? 'bg-white text-primary shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    直接录入总价 (万元)
                                </button>
                            </div>

                            {/* Input Fields based on Mode */}
                            <div className="flex items-center gap-4">
                                {b.costMode === 'power' && (
                                    <>
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-xs text-slate-400">当前负荷:</span>
                                            <span className="text-xs font-bold text-slate-700">{b.load} kW</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-[2]">
                                            <label className="text-xs text-slate-500 whitespace-nowrap">改造成本单价:</label>
                                            <div className="relative w-full">
                                                <input
                                                    type="number" step="10"
                                                    value={b.customUnitCost || ''}
                                                    placeholder={STRATEGIES[b.strategy as keyof typeof STRATEGIES].unitCost.toString()}
                                                    onChange={(e) => updateBuildingSimpleField(b.id, 'customUnitCost', parseFloat(e.target.value))}
                                                    className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:border-primary outline-none bg-white font-medium"
                                                />
                                                <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">元/kW</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {b.costMode === 'area' && (
                                    <>
                                        <div className="flex items-center gap-2 flex-1">
                                            <label className="text-xs text-slate-500 whitespace-nowrap">建筑面积:</label>
                                            <div className="relative w-full">
                                                <input
                                                    type="number"
                                                    value={b.area || ''}
                                                    onChange={(e) => updateBuildingSimpleField(b.id, 'area', parseFloat(e.target.value))}
                                                    className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:border-primary outline-none bg-white font-medium"
                                                />
                                                <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">㎡</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-[1.5]">
                                            <label className="text-xs text-slate-500 whitespace-nowrap">预估单价:</label>
                                            <div className="relative w-full">
                                                <input
                                                    type="number" step="10"
                                                    value={b.customUnitCost || ''}
                                                    placeholder="200"
                                                    onChange={(e) => updateBuildingSimpleField(b.id, 'customUnitCost', parseFloat(e.target.value))}
                                                    className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:border-primary outline-none bg-white font-medium"
                                                />
                                                <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">元/㎡</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {b.costMode === 'fixed' && (
                                    <div className="flex items-center gap-2 w-full">
                                        <label className="text-xs text-slate-500 whitespace-nowrap">项目改造总价:</label>
                                        <div className="relative w-full">
                                            <input
                                                type="number" step="1"
                                                value={b.customTotalInvest || ''}
                                                placeholder="0"
                                                onChange={(e) => updateBuildingSimpleField(b.id, 'customTotalInvest', parseFloat(e.target.value))}
                                                className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:border-primary outline-none bg-white font-bold text-slate-800"
                                            />
                                            <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">万元</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
