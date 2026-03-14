import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area, ReferenceLine, Cell } from 'recharts';
import { useHvacLogic, STRATEGIES } from './hooks';
import { HvacBuildingCard } from './components/HvacBuildingCard';

const RetrofitHVAC: React.FC = () => {
    const {
        mode, setMode,
        globalParams, setGlobalParams,
        schedule, setSchedule,
        hvacBuildings,
        isChartExpanded, setIsChartExpanded,
        isFinancialModalOpen, setIsFinancialModalOpen,
        financials,
        chartData,
        currentModule,
        toggleModule,
        saveProject,
        toggleBuilding,
        updateBuildingRunHours,
        updateBuildingStrategy,
        updateBuildingSimpleField,
        projectBaseInfo,
        omRate
    } = useHvacLogic();

    if (!currentModule) return null;

    return (
        <div className="flex h-full bg-slate-50 relative">
            {/* Left Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">暖通空调改造配置</h2>
                            <p className="text-xs text-slate-500">分楼栋差异化策略与全生命周期财务测算</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full ml-4">
                            <span className={`text-xs font-bold ${currentModule.isActive ? 'text-primary' : 'text-slate-400'}`}>
                                {currentModule.isActive ? '模块已启用' : '模块已停用'}
                            </span>
                            <button
                                onClick={() => toggleModule('retrofit-hvac')}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${currentModule.isActive ? 'bg-primary' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${currentModule.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">
                        <span className="material-icons text-base">history</span> 加载历史方案
                    </button>
                </header>

                <div className={`flex-1 overflow-y-auto p-8 pb-32 transition-opacity duration-300 ${currentModule.isActive ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                    <div className="max-w-6xl mx-auto space-y-6">

                        {/* Mode Toggle */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">测算参数配置</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    {mode === 'simple' ? '快速测算：仅需设置基础参数与选择策略包' : '精确估值：支持自定义电价计算、单栋建筑参数微调'}
                                </p>
                            </div>
                            <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
                                <button
                                    onClick={() => setMode('simple')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${mode === 'simple' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    <span className="material-icons text-[16px]">speed</span> 快速测算
                                </button>
                                <button
                                    onClick={() => setMode('advanced')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${mode === 'advanced' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    <span className="material-icons text-[16px]">tune</span> 精确估值
                                </button>
                            </div>
                        </div>

                        {/* Global Params */}
                        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="material-icons text-slate-400">tune</span>
                                {mode === 'simple' ? '基础运行参数' : '高级运行与财务参数'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Price Calculation */}
                                <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            空调加权电价
                                        </label>
                                        {mode === 'advanced' && (
                                            <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">自动计算</span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number" step="0.01"
                                            value={globalParams.electricityPrice}
                                            onChange={(e) => setGlobalParams({ ...globalParams, electricityPrice: parseFloat(e.target.value) })}
                                            disabled={mode === 'advanced'}
                                            className={`w-full pl-3 pr-10 py-3 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 outline-none bg-white transition-all ${mode === 'advanced' ? 'text-slate-400 bg-slate-50 border-slate-100' : 'focus:border-primary focus:ring-4 focus:ring-primary/5'}`}
                                        />
                                        <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">元/kWh</span>
                                        {mode === 'advanced' && (
                                            <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                                                <span className="material-icons text-[12px]">schedule</span> 基于 {schedule.start}:00 至 {schedule.end}:00
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Gas Price - Only show if CCHP is used */}
                                {hvacBuildings.some(b => b.active && b.strategy === 'cchp') && (
                                    <div className="space-y-2 p-4 bg-orange-50/50 rounded-xl border border-orange-100 animate-fade-in">
                                        <label className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
                                            <span className="material-icons text-[14px]">local_fire_department</span>
                                            天然气单价
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number" step="0.1"
                                                value={globalParams.gasPrice}
                                                onChange={(e) => setGlobalParams({ ...globalParams, gasPrice: parseFloat(e.target.value) })}
                                                className="w-full pl-3 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/5 outline-none transition-all"
                                            />
                                            <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">元/m³</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                                        原机房基准能效 (SCOP)
                                        <span className="material-icons text-[14px] text-slate-400 ml-1 align-text-bottom cursor-help" title="体现原有水系统整体制冷效率，通常老旧机房在 2.5~3.2 之间">info</span>
                                    </label>
                                    <div className="relative flex items-center gap-3">
                                        <input
                                            type="range" min="2.0" max="4.0" step="0.1"
                                            value={globalParams.baseSystemSCOP || 3.0}
                                            onChange={(e) => setGlobalParams({ ...globalParams, baseSystemSCOP: parseFloat(e.target.value) })}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <span className="w-12 text-right text-lg font-bold text-slate-800">{(globalParams.baseSystemSCOP || 3.0).toFixed(1)}</span>
                                    </div>
                                </div>

                                {/* Average Load Factor (Expert Mode only but we show in simple as well for transparency, or keep advanced) */}
                                {mode === 'advanced' && (
                                    <>
                                        <div className="space-y-2 p-4 bg-purple-50/50 rounded-xl border border-purple-100 animate-fade-in">
                                            <label className="text-xs font-bold text-purple-600 uppercase tracking-wider block mb-1">
                                                AI 智控增益系数
                                                <span className="material-icons text-[14px] text-purple-400 ml-1 align-text-bottom cursor-help" title="AI 系统通过实时策略优化可额外带来的效率提升。通常在 1.05~1.15 之间">info</span>
                                            </label>
                                            <div className="relative flex items-center gap-3">
                                                <input
                                                    type="range" min="1.0" max="1.2" step="0.01"
                                                    value={globalParams.aiGainFactor || 1.10}
                                                    onChange={(e) => setGlobalParams({ ...globalParams, aiGainFactor: parseFloat(e.target.value) })}
                                                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                />
                                                <span className="w-12 text-right text-lg font-bold text-purple-800">{(globalParams.aiGainFactor || 1.10).toFixed(2)}x</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-fade-in">
                                            <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                                                入驻率修正 (负荷)
                                                <span className="material-icons text-[14px] text-indigo-400 ml-1 align-text-bottom cursor-help" title="园区实际运营时的入驻率。影响总制冷负荷基准">info</span>
                                            </label>
                                            <div className="relative flex items-center gap-3">
                                                <input
                                                    type="range" min="0.1" max="1.0" step="0.05"
                                                    value={globalParams.occupancyFactor || 0.9}
                                                    onChange={(e) => setGlobalParams({ ...globalParams, occupancyFactor: parseFloat(e.target.value) })}
                                                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                />
                                                <span className="w-12 text-right text-lg font-bold text-indigo-800">{((globalParams.occupancyFactor || 0.9) * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 p-4 bg-teal-50/50 rounded-xl border border-teal-100 animate-fade-in">
                                            <label className="text-xs font-bold text-teal-600 uppercase tracking-wider block mb-1">
                                                气候调节因子 (HDD/CDD)
                                                <span className="material-icons text-[14px] text-teal-400 ml-1 align-text-bottom cursor-help" title="根据当地历年气象度日数修正。1.0 为标准年，若今年极端炎热可上调">info</span>
                                            </label>
                                            <div className="relative flex items-center gap-3">
                                                <input
                                                    type="range" min="0.8" max="1.2" step="0.05"
                                                    value={globalParams.climateAdjust || 1.0}
                                                    onChange={(e) => setGlobalParams({ ...globalParams, climateAdjust: parseFloat(e.target.value) })}
                                                    className="w-full h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                                                />
                                                <span className="w-12 text-right text-lg font-bold text-teal-800">{(globalParams.climateAdjust || 1.0).toFixed(2)}x</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 p-4 bg-sky-50/50 rounded-xl border border-sky-100 animate-fade-in">
                                            <label className="text-xs font-bold text-sky-600 uppercase tracking-wider block mb-1 text-center">系统平均负载率</label>
                                            <div className="relative flex items-center gap-3">
                                                <input
                                                    type="range" min="0.3" max="0.9" step="0.05"
                                                    value={globalParams.avgLoadFactor || 0.6}
                                                    onChange={(e) => setGlobalParams({ ...globalParams, avgLoadFactor: parseFloat(e.target.value) })}
                                                    className="w-full h-2 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                                                />
                                                <span className="w-12 text-right text-lg font-bold text-sky-800">{((globalParams.avgLoadFactor || 0.6) * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {mode === 'advanced' && (
                                    <>
                                        {/* Runtime */}
                                        <div className="space-y-2 p-4 bg-blue-50/30 rounded-xl border border-blue-100">
                                            <label className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">运行时段 (电价范围)</label>
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number" min="0" max="24"
                                                        value={schedule.start}
                                                        onChange={(e) => setSchedule({ ...schedule, start: parseInt(e.target.value) })}
                                                        className="w-full py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold text-center outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                                    />
                                                    <span className="absolute right-2 top-4 text-[10px] font-bold text-slate-400">时</span>
                                                </div>
                                                <span className="text-slate-400 font-bold">至</span>
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number" min="0" max="24"
                                                        value={schedule.end}
                                                        onChange={(e) => setSchedule({ ...schedule, end: parseInt(e.target.value) })}
                                                        className="w-full py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold text-center outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                                    />
                                                    <span className="absolute right-2 top-4 text-[10px] font-bold text-slate-400">时</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Growth */}
                                        <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100 lg:col-span-2">
                                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">贴现率 与 维保支出年增长率</label>
                                            <div className="flex gap-4">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number" step="0.1" value={globalParams.discountRate}
                                                        onChange={(e) => setGlobalParams({ ...globalParams, discountRate: parseFloat(e.target.value) })}
                                                        className="w-full pl-3 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                                    />
                                                    <span className="absolute right-3 top-4 text-xs font-bold text-slate-400">贴现%</span>
                                                </div>
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number" step="0.1" value={globalParams.maintenanceGrowth}
                                                        onChange={(e) => setGlobalParams({ ...globalParams, maintenanceGrowth: parseFloat(e.target.value) })}
                                                        className="w-full pl-3 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                                    />
                                                    <span className="absolute right-3 top-4 text-xs font-bold text-slate-400">增长%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* Investment Mode Section (New for EMC/EPC) */}
                        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <span className="material-icons text-red-500">paid</span> 投资与商业模式
                            </h3>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    {[
                                        { id: 'self', label: '业主自投 (EPC)', icon: 'account_balance' },
                                        { id: 'emc', label: 'EMC 节能分成', icon: 'handshake' },
                                    ].map((invMode) => (
                                        <button
                                            key={invMode.id}
                                            onClick={() => setGlobalParams({ ...globalParams, investmentMode: invMode.id as any })}
                                            className={`flex-1 flex flex-col items-center p-4 rounded-xl border-2 transition-all gap-2 ${globalParams.investmentMode === invMode.id
                                                ? 'border-primary bg-blue-50 text-primary'
                                                : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500 hover:bg-slate-50'
                                                }`}
                                        >
                                            <span className={`material-icons text-3xl ${globalParams.investmentMode === invMode.id ? 'text-primary' : 'text-slate-400'}`}>
                                                {invMode.icon}
                                            </span>
                                            <span className="text-sm font-bold">{invMode.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 rounded-xl border border-slate-200 ${globalParams.investmentMode === 'emc' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100' : 'bg-white'}`}>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">投入成本划分 (万元)</label>
                                            <span className="text-[10px] font-bold text-primary bg-blue-100 px-2 py-0.5 rounded">建议合计: {(financials.totalInvestment || 0).toFixed(2)} 万</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 bg-white/50 p-4 rounded-lg border border-slate-100 italic">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-400 block">主机/硬件 (约60%)</label>
                                                <input type="number" value={globalParams.hardwareCost} onChange={(e) => setGlobalParams({ ...globalParams, hardwareCost: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-primary font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-400 block">工程/调测 (约20%)</label>
                                                <input type="number" value={globalParams.installCost} onChange={(e) => setGlobalParams({ ...globalParams, installCost: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-primary font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-400 block">AI智控/调优 (约20%)</label>
                                                <input type="number" value={globalParams.systemCost} onChange={(e) => setGlobalParams({ ...globalParams, systemCost: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-primary font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-400 block">其他/辅材</label>
                                                <input type="number" value={globalParams.auxCost} onChange={(e) => setGlobalParams({ ...globalParams, auxCost: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-primary font-bold" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">收益分配比例</label>
                                        <div className="p-5 bg-white rounded-xl border border-slate-100 flex-1 h-full flex flex-col justify-center">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-blue-800">甲方(业主)分成比例</label>
                                                <span className="text-lg font-black text-blue-600">{globalParams.emcOwnerShareRate}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100" step="5"
                                                value={globalParams.emcOwnerShareRate}
                                                onChange={(e) => setGlobalParams({ ...globalParams, emcOwnerShareRate: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-primary my-4"
                                            />
                                            <div className="flex justify-between text-[10px] font-bold text-blue-400 px-1">
                                                <span>全归投资方</span>
                                                <span>全归业主</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Building Strategy Configuration */}
                        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <span className="material-icons text-blue-500">domain_add</span>
                                    分楼栋改造策略配置
                                </h3>
                                <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 基础(COP 4.5)</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 中级(COP 5.2)</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> 深度(COP 6.2)</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> 三联供(CCHP)</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {hvacBuildings.map((b) => (
                                    <HvacBuildingCard
                                        key={b.id}
                                        building={b}
                                        mode={mode}
                                        globalParams={globalParams}
                                        toggleBuilding={toggleBuilding}
                                        updateBuildingRunHours={updateBuildingRunHours}
                                        updateBuildingStrategy={updateBuildingStrategy}
                                        updateBuildingSimpleField={updateBuildingSimpleField}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="fixed bottom-0 left-64 right-[340px] bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 px-8 z-40 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                            <span className="material-icons text-[18px]">history</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">自动同步</span>
                            <span className="text-[10px] text-slate-400 font-medium">数据实时计算中...</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-6 py-2.5 text-sm font-semibold rounded-xl text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">重置</button>
                        <button
                            onClick={saveProject}
                            className="px-8 py-2.5 text-sm font-semibold rounded-xl bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover transition-all flex items-center gap-2">
                            保存配置 <span className="material-icons text-[18px]">save</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Analytics */}
            <aside className={`w-[340px] bg-white border-l border-slate-200 flex flex-col shrink-0 z-20 h-screen overflow-y-auto shadow-xl mb-16 transition-all duration-300 ${currentModule.isActive ? '' : 'opacity-60 grayscale'}`}>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10 transition-all">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-icons text-primary">assessment</span> 实时预估收益分析
                    </h3>
                    {!currentModule.isActive && <span className="text-xs font-bold text-red-500 border border-red-200 bg-red-50 px-2 py-0.5 rounded shadow-sm">未启用</span>}
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-yellow-100 rounded text-yellow-600"><span className="material-icons text-sm">bolt</span></div>
                            <span className="text-xs font-semibold text-slate-500 uppercase">年节电费用</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900 tracking-tight">¥ {financials.totalYearlySaving.toFixed(1)}</span>
                            <span className="text-sm text-slate-500">万</span>
                        </div>
                        <div className="mt-2 text-xs font-medium text-slate-400 font-mono">
                            系统 SCOP: <span className="text-slate-800 font-bold">↑至 {(financials.totalYearlySaving > 0 ? (hvacBuildings.reduce((sum, b) => {
                                if (!b.active) return sum;
                                let sk = b.strategy;
                                if (sk === 'basic') sk = 'vfd';
                                if (sk === 'intermediate') sk = 'ai_control';
                                if (sk === 'advanced') sk = 'full_retrofit';
                                return sum + ((STRATEGIES[sk as keyof typeof STRATEGIES] || STRATEGIES.vfd).targetSCOP);
                            }, 0) / (hvacBuildings.filter(b => b.active).length || 1)) : 0).toFixed(1)}</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-red-100 rounded text-red-600"><span className="material-icons text-sm">savings</span></div>
                            <span className="text-xs font-semibold text-slate-500 uppercase">当前视角年净收益</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900 tracking-tight">¥ {financials.investorRevenue.toFixed(1)}</span>
                            <span className="text-sm text-slate-500">万元</span>
                        </div>
                        {globalParams.investmentMode === 'emc' && (
                            <div className="mt-2 text-xs font-medium text-blue-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                业主分成: ¥ {financials.ownerBenefit.toFixed(2)} 万
                            </div>
                        )}
                    </div>

                    {/* AI Expert Analysis Card (New) */}
                    {globalParams.aiGainFactor > 1 && (
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-4 rounded-xl shadow-lg text-white relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                                <span className="material-icons" style={{ fontSize: '80px' }}>psychology</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2 relative z-10">
                                <span className="material-icons text-sm text-indigo-200">auto_awesome</span>
                                <span className="text-[10px] font-bold uppercase text-indigo-100">AI 智慧提效增益 (已计入)</span>
                            </div>
                            <div className="flex items-baseline gap-1 relative z-10">
                                <span className="text-xl font-black text-white">额外 +{((globalParams.aiGainFactor - 1) * 100).toFixed(0)}%</span>
                                <span className="text-[10px] text-indigo-100">节能空间</span>
                            </div>
                            <p className="mt-2 text-[10px] text-indigo-100/80 leading-relaxed relative z-10">
                                基于 AI 算法预测负荷并动态调优，在硬件节能基础上深度压榨能效。
                            </p>
                        </div>
                    )}

                    {/* Baseline Adjustment Summary (New) */}
                    <div className="bg-slate-800 p-4 rounded-xl shadow-sm text-slate-300 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-icons text-[14px] text-slate-500">analytics</span>
                            <span className="text-[10px] font-bold uppercase text-slate-400">专家基准修正清单</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500">当前入驻率:</span>
                                <span className="text-white font-mono font-bold bg-slate-700 px-1.5 py-0.5 rounded">{((globalParams.occupancyFactor || 1) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500">气象调节因子 (CDD):</span>
                                <span className="text-white font-mono font-bold bg-slate-700 px-1.5 py-0.5 rounded">{(globalParams.climateAdjust || 1).toFixed(2)}x</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500">系统平均负载率:</span>
                                <span className="text-white font-mono font-bold bg-slate-700 px-1.5 py-0.5 rounded">{((globalParams.avgLoadFactor || 1) * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary p-4 rounded-xl shadow-lg shadow-primary/20 text-white relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl group-hover:bg-white/20 transition-all"></div>
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                            <div className="p-1.5 bg-white/20 rounded text-white"><span className="material-icons text-sm">account_balance_wallet</span></div>
                            <span className="text-xs font-semibold text-blue-100 uppercase">总投资额</span>
                        </div>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-3xl font-bold tracking-tight">¥ {financials.totalInvestment.toFixed(2)}</span>
                            <span className="text-sm text-blue-100">万元</span>
                        </div>
                        <div className="mt-2 text-xs text-blue-100 relative z-10 font-bold">
                            静态回收期: <span className="text-white">{financials.paybackPeriod.toFixed(1)}</span> 年
                        </div>
                    </div>

                    {financials.cchpGasCost > 0 && (
                        <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 text-orange-100/50">
                                <span className="material-icons" style={{ fontSize: '100px' }}>local_fire_department</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2 relative z-10">
                                <div className="p-1.5 bg-orange-100 rounded text-orange-600"><span className="material-icons text-sm">local_fire_department</span></div>
                                <span className="text-xs font-semibold text-slate-500 uppercase">年天然气采购成本</span>
                            </div>
                            <div className="flex items-baseline gap-2 relative z-10">
                                <span className="text-2xl font-bold text-orange-600 tracking-tight">- ¥ {financials.cchpGasCost}</span>
                                <span className="text-sm text-slate-500">万元</span>
                            </div>
                            <div className="mt-1 text-[10px] text-slate-400 relative z-10">
                                三联供(CCHP)专项支出，已在净收益中扣减
                            </div>
                        </div>
                    )}

                    {/* Clickable Chart */}
                    <div
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer group hover:border-primary/50 relative"
                        onClick={() => setIsChartExpanded(true)}
                    >
                        <div className="flex items-center justify-between mb-3 relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-100 rounded text-indigo-600"><span className="material-icons text-sm">insert_chart</span></div>
                                <span className="text-xs font-semibold text-slate-500 uppercase">月度耗电对比</span>
                            </div>
                            <span className="material-icons text-slate-300 text-sm group-hover:text-primary">open_in_full</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-24 opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorRetrofit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="base" stroke="#94a3b8" fillOpacity={1} fill="url(#colorBase)" strokeWidth={1} />
                                    <Area type="monotone" dataKey="retrofit" stroke="#10b981" fillOpacity={1} fill="url(#colorRetrofit)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="h-24 w-full flex items-center justify-center pointer-events-none z-10 relative"></div>
                    </div>

                    {/* Financial Detail Trigger */}
                    <div
                        onClick={() => setIsFinancialModalOpen(true)}
                        className="mt-4 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                        <div className="absolute right-0 top-0 w-16 h-16 bg-white/10 rounded-full -mr-4 -mt-4 blur-xl group-hover:bg-white/20 transition-all"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <span className="material-icons text-sm text-yellow-400">monetization_on</span> 收益详细分析
                                </h4>
                                <p className="text-[10px] text-slate-300 mt-1">查看 25 年现金流、IRR、回收期</p>
                            </div>
                            <span className="material-icons text-white/50 group-hover:text-white transition-colors">chevron_right</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Expanded Chart Modal */}
            {isChartExpanded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6" onClick={() => setIsChartExpanded(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-5xl h-[600px] shadow-2xl p-8 flex flex-col relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><span className="material-icons">insert_chart</span></span>
                                    全年逐月耗电对比分析
                                </h2>
                            </div>
                            <button onClick={() => setIsChartExpanded(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <span className="material-icons text-2xl">close</span>
                            </button>
                        </div>
                        <div className="flex-1 w-full min-h-0 bg-slate-50 rounded-xl border border-slate-100 p-6 pt-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10}
                                        label={{ value: '耗电量 (万kWh)', angle: -90, position: 'insideLeft', offset: -10, style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 12 } }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                    <Bar dataKey="base" name="改造前预估" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="retrofit" name="改造后预估" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Financial Modal */}
            {isFinancialModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6" onClick={() => setIsFinancialModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[650px] shadow-2xl p-8 flex flex-col relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <span className="p-2 bg-blue-100 text-blue-600 rounded-lg"><span className="material-icons text-2xl">ac_unit</span></span>
                                    暖通空调改造 25年收益结构与财务分析
                                </h2>
                            </div>
                            <button onClick={() => setIsFinancialModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <span className="material-icons text-2xl">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">项目总投资</p>
                                    <div className="text-2xl font-bold text-slate-900">¥ {(financials.totalInvestment || 0).toFixed(2)} <span className="text-sm font-normal text-slate-500">万</span></div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">累计净收益</p>
                                    <div className="text-2xl font-bold text-emerald-600">¥ {(financials.yearlyDetails?.reduce((sum: number, d: any) => sum + d.netIncome, 0) || 0).toFixed(2)} <span className="text-sm font-normal text-slate-500">万</span></div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> 业主累计收益
                                    </p>
                                    <div className="text-2xl font-bold text-blue-600">¥ {(financials.yearlyDetails?.reduce((sum: number, d: any) => sum + d.ownerBenefit, 0) || 0).toFixed(2)} <span className="text-sm font-normal text-slate-500">万</span></div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">内部收益率 (IRR)</p>
                                    <div className="text-2xl font-bold text-purple-600">{(financials.irr || 0).toFixed(2)}%</div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">静态回收期</p>
                                    <div className="text-2xl font-bold text-orange-500">{(financials.paybackPeriod || 0).toFixed(2)} <span className="text-sm font-normal text-slate-500">年</span></div>
                                </div>
                            </div>

                            {/* Chart section */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <span className="material-icons text-primary text-base">savings</span> 25年累计现金流趋势
                                </h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={financials.yearlyDetails?.map((d: any, i: number, arr: any[]) => {
                                            const cumulative = arr.slice(0, i + 1).reduce((sum: number, item: any) => sum + item.netIncome, -financials.totalInvestment);
                                            return { year: d.year, value: parseFloat(cumulative.toFixed(2)) };
                                        }) || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorCashHvac" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                                formatter={(value: number) => [`¥ ${value} 万`, '累计净值']}
                                                labelFormatter={(label) => `运营第 ${label} 年`}
                                            />
                                            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCashHvac)" />
                                            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-0 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                    <h3 className="text-sm font-bold text-slate-700">测算数据明细 (25年)</h3>
                                    <span className="text-[10px] text-slate-400">单位: 万元 | 精度: 0.01</span>
                                </div>
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-4 sticky top-0 left-0 z-10 bg-slate-50 min-w-[100px]">运营年份</th>
                                            <th className="px-5 py-4 sticky top-0 bg-slate-50 text-right min-w-[140px]">年营收</th>
                                            <th className="px-5 py-4 sticky top-0 bg-slate-50 text-right min-w-[100px]">
                                                运维费 <br />
                                                <span className="text-[10px] font-normal text-slate-400">({omRate}%)</span>
                                            </th>
                                            <th className="px-5 py-4 sticky top-0 bg-slate-50 text-right min-w-[100px]">
                                                保险费 <br />
                                                <span className="text-[10px] font-normal text-slate-400">({projectBaseInfo?.insuranceRate ?? 0.35}%)</span>
                                            </th>
                                            <th className="px-5 py-4 sticky top-0 bg-slate-50 text-right min-w-[140px] group relative cursor-help border-l border-slate-200">
                                                增值税及附加
                                                <span className="material-icons absolute top-3 right-1 text-slate-400 text-xs text-opacity-70 group-hover:text-primary transition-colors">info</span>
                                                <div className="absolute top-12 right-0 w-56 bg-slate-800 text-white text-[10px] p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-50 text-left pointer-events-none break-normal whitespace-pre-line font-normal">
                                                    <span className="font-bold text-blue-300 block mb-1">抵扣结转说明：</span>
                                                    首期全投资产生的进项税先全额留抵。<br />不足扣填0。<br />仅在有实际缴纳时付附加税。
                                                </div>
                                            </th>
                                            <th className="px-5 py-4 sticky top-0 bg-slate-50 text-right min-w-[140px] group relative cursor-help">
                                                所得税费
                                                <span className="material-icons absolute top-3 right-1 text-slate-400 text-xs text-opacity-70 group-hover:text-primary transition-colors">info</span>
                                                <div className="absolute top-12 right-0 w-64 bg-slate-800 text-white text-[10px] p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-50 text-left pointer-events-none break-normal whitespace-pre-line font-normal">
                                                    <span className="font-bold text-orange-300 block mb-1">折旧说明 (DDB)：</span>
                                                    10年双倍余额递减法折旧。<br />
                                                </div>
                                            </th>
                                            <th className="px-5 py-4 sticky top-0 z-10 bg-slate-50/50 text-right font-bold text-slate-700 min-w-[140px] border-l border-slate-200">净现金流</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 tracking-tight">
                                        <tr className="hover:bg-slate-50 bg-slate-50/30">
                                            <td className="px-5 py-3 font-bold text-slate-700 sticky left-0 bg-slate-50/30">第 0 年 (投资)</td>
                                            <td className="px-5 py-3 text-right text-slate-400">-</td>
                                            <td className="px-5 py-3 text-right text-slate-400">-</td>
                                            <td className="px-5 py-3 text-right text-slate-400">-</td>
                                            <td className="px-5 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                            <td className="px-5 py-3 text-right text-slate-400">-</td>
                                            <td className="px-5 py-3 text-right font-bold text-red-500 border-l border-slate-100">
                                                -{(financials.totalInvestment || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                        {financials.yearlyDetails?.map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3 font-medium text-slate-700 sticky left-0 bg-white">第 {row.year} 年</td>
                                                <td className="px-5 py-3 text-right text-orange-600 font-medium font-mono border-r border-slate-100">{(row.revenue || 0).toFixed(2)}</td>

                                                {/* Cost */}
                                                <td className="px-5 py-3 text-right text-slate-500 font-mono">-{(row.om || 0).toFixed(2)}</td>
                                                <td className="px-5 py-3 text-right text-slate-500 font-mono">-{(row.insurance || 0).toFixed(2)}</td>

                                                {/* Tax */}
                                                <td className="px-5 py-3 text-right text-red-400 font-mono border-l border-slate-100">
                                                    -{(row.tax - row.incomeTax || 0).toFixed(2)}
                                                </td>
                                                <td className="px-5 py-3 text-right text-red-500 font-mono">
                                                    -{(row.incomeTax || 0).toFixed(2)}
                                                </td>

                                                {/* Net */}
                                                <td className={`px-5 py-3 text-right font-bold bg-slate-50/30 font-mono border-l border-slate-100 ${row.netIncome >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {(row.netIncome || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RetrofitHVAC;
