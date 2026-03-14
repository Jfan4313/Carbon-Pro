import React from 'react';
import { useStorageLogic } from './hooks';
import { StorageSimulationChart } from './components/StorageSimulationChart';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

const RetrofitStorage: React.FC = () => {
    const {
        mode, setMode,
        isChartExpanded, setIsChartExpanded,
        basicParams, setBasicParams,
        advParams, setAdvParams,
        strategyType, setStrategyType,
        baselineMode, setBaselineMode,
        aiFeatures, setAiFeatures,
        investmentConfig, setInvestmentConfig,
        marketPriceModel, setMarketPriceModel,
        totalTransformerCap,
        maxHistoricalLoad,
        remainingCap,
        isOverloadRisk,
        simulationData,
        financials,
        solarModule,
        saveProject,
        toggleModule,
        currentModule,
        projectBaseInfo,
        omRate
    } = useStorageLogic();

    const isEmc = investmentConfig.mode === 'emc';

    if (!currentModule) return null;

    return (
        <div className="flex h-full bg-slate-50 relative">
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">储能系统配置</h2>
                            <p className="text-xs text-slate-500">削峰填谷与需量管理策略</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full ml-4">
                            <span className={`text-xs font-bold ${currentModule.isActive ? 'text-primary' : 'text-slate-400'}`}>
                                {currentModule.isActive ? '模块已启用' : '模块已停用'}
                            </span>
                            <button
                                onClick={() => toggleModule('retrofit-storage')}
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
                                <h3 className="text-lg font-bold text-slate-800">储能系统参数</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    {mode === 'simple' ? '快速测算：基于标准模型快速评估投资回报' : '精确估值：综合考虑环境约束、物理衰减与策略叠加'}
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
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${mode === 'advanced' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    <span className="material-icons text-[16px]">tune</span> 精确估值
                                </button>
                            </div>
                        </div>

                        {/* --- ADVANCED ONLY: Environment Verification --- */}
                        {mode === 'advanced' && (
                            <section className="bg-gradient-to-br from-indigo-50 via-white to-white rounded-xl shadow-sm border border-indigo-100 p-5 animate-fade-in">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="p-1 bg-indigo-100 text-indigo-600 rounded"><span className="material-icons text-sm">verified_user</span></span>
                                    <h3 className="text-sm font-bold text-indigo-900">配置依据 / 环境校验</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/60 rounded-lg p-3 border border-indigo-50 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-xs text-slate-500 font-medium">变压器报装容量</span>
                                                <div className="text-lg font-bold text-slate-700">{totalTransformerCap} <span className="text-xs font-normal">kVA</span></div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-slate-500 font-medium">剩余可分配功率</span>
                                                <div className={`text-lg font-bold ${remainingCap < 100 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                    {remainingCap} <span className="text-xs font-normal">kW</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`flex items-start gap-2 p-2 rounded text-xs transition-colors ${isOverloadRisk ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                                            <span className="material-icons text-sm">{isOverloadRisk ? 'warning' : 'check_circle'}</span>
                                            <div>
                                                <span className="font-bold block">{isOverloadRisk ? '存在过载风险' : '容量配置安全'}</span>
                                                {isOverloadRisk && <span>当前储能功率({basicParams.power}kW) 超过剩余可用容量，建议下调。</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 rounded-lg p-3 border border-indigo-50 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-medium">关联光伏系统</span>
                                            {solarModule?.isActive ? (
                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">已检测到光伏</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] rounded-full">未启用光伏</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <div>
                                                <div className="text-xs text-slate-400">光伏装机容量</div>
                                                <div className="text-base font-bold text-slate-700">{solarModule?.isActive ? solarModule.kpiPrimary.value : '0 kWp'}</div>
                                            </div>
                                            {solarModule?.isActive && (
                                                <div className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">
                                                    可在下方策略中勾选联动
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 1. Basic & Investment Parameters */}
                        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="material-icons text-green-600">battery_charging_full</span>
                                {mode === 'simple' ? '系统规模与投资估算' : '系统规模与高级物理特性'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500">额定功率 (kW)</label>
                                    <input
                                        type="number"
                                        value={basicParams.power}
                                        onChange={(e) => setBasicParams({ ...basicParams, power: parseFloat(e.target.value) })}
                                        className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-primary ${isOverloadRisk && mode === 'advanced' ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'}`}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500">系统容量 (kWh)</label>
                                    <input
                                        type="number"
                                        value={basicParams.capacity}
                                        onChange={(e) => setBasicParams({ ...basicParams, capacity: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500">建设单价 (元/kWh)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={basicParams.unitCost}
                                            onChange={(e) => setBasicParams({ ...basicParams, unitCost: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-primary"
                                        />
                                        <span className="absolute right-3 top-3 text-xs font-bold text-slate-300">EPC</span>
                                    </div>
                                </div>
                            </div>

                            {/* Advanced Physics Params (Advanced Only) */}
                            {mode === 'advanced' && (
                                <div className="border-t border-slate-100 pt-6 mt-2 grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">放电深度 (DOD)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={advParams.dod} onChange={(e) => setAdvParams({ ...advParams, dod: parseFloat(e.target.value) })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-primary" />
                                            <span className="text-xs text-slate-500">%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">综合效率 (RTE)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={advParams.rte} onChange={(e) => setAdvParams({ ...advParams, rte: parseFloat(e.target.value) })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-primary" />
                                            <span className="text-xs text-slate-500">%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">循环寿命</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={advParams.cycles} onChange={(e) => setAdvParams({ ...advParams, cycles: parseFloat(e.target.value) })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-primary" />
                                            <span className="text-xs text-slate-500">次</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">年衰减率</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="0.1" value={advParams.degradation} onChange={(e) => setAdvParams({ ...advParams, degradation: parseFloat(e.target.value) })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-primary" />
                                            <span className="text-xs text-slate-500">%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">辅助功耗</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="0.1" value={advParams.auxPower} onChange={(e) => setAdvParams({ ...advParams, auxPower: parseFloat(e.target.value) })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-primary" />
                                            <span className="text-xs text-slate-500">kW</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Investment Mode Section */}
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
                                            onClick={() => setInvestmentConfig({ ...investmentConfig, mode: invMode.id as any })}
                                            className={`flex-1 flex flex-col items-center p-4 rounded-xl border-2 transition-all gap-2 ${investmentConfig.mode === invMode.id
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500 hover:bg-slate-50'
                                                }`}
                                        >
                                            <span className={`material-icons text-3xl ${investmentConfig.mode === invMode.id ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {invMode.icon}
                                            </span>
                                            <span className="text-sm font-bold">{invMode.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 rounded-xl border border-slate-200 ${investmentConfig.mode === 'emc' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100' : 'bg-white'}`}>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">投入成本划分 (万元)</label>
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">建议合计: {financials.investment.toFixed(2)} 万</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 bg-white/50 p-4 rounded-lg border border-slate-100 italic">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-400 block">动力电池/电芯</label>
                                                <input type="number" value={investmentConfig.hardwareCost} onChange={(e) => setInvestmentConfig({ ...investmentConfig, hardwareCost: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-emerald-500 font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-400 block">PCS/变流器</label>
                                                <input type="number" value={investmentConfig.pcsCost} onChange={(e) => setInvestmentConfig({ ...investmentConfig, pcsCost: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-emerald-500 font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-400 block">BMS/EMS/消防</label>
                                                <input type="number" value={investmentConfig.systemCost} onChange={(e) => setInvestmentConfig({ ...investmentConfig, systemCost: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-emerald-500 font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-400 block">施工/并网/辅材</label>
                                                <input type="number" value={investmentConfig.civilCost} onChange={(e) => setInvestmentConfig({ ...investmentConfig, civilCost: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-emerald-500 font-bold" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">收益分配比例</label>
                                        <div className="p-5 bg-white rounded-xl border border-slate-100 flex-1 h-full flex flex-col justify-center">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-emerald-800">甲方(业主)分成比例</label>
                                                <span className="text-lg font-black text-emerald-600">{investmentConfig.emcOwnerShareRate}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100" step="5"
                                                value={investmentConfig.emcOwnerShareRate}
                                                onChange={(e) => setInvestmentConfig({ ...investmentConfig, emcOwnerShareRate: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 my-4"
                                            />
                                            <div className="flex justify-between text-[10px] font-bold text-emerald-400 px-1">
                                                <span>全归投资方</span>
                                                <span>全归业主</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 1.5 Market Pricing Mechanism */}
                        {mode === 'advanced' && (
                            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                                <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <span className="material-icons text-orange-500">price_change</span>
                                    电价结算机制 (Market Pricing)
                                </h3>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setMarketPriceModel('tou')}
                                        className={`flex-1 flex flex-col items-center p-4 rounded-xl border-2 transition-all gap-2 ${marketPriceModel === 'tou' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <span className="material-icons text-2xl">receipt_long</span>
                                        <span className="text-sm font-bold">目录电价 (ToU)</span>
                                        <span className="text-[10px] opacity-70">跟随园区全局电价基准</span>
                                    </button>
                                    <button
                                        onClick={() => setMarketPriceModel('spot')}
                                        className={`flex-1 flex flex-col items-center p-4 rounded-xl border-2 transition-all gap-2 ${marketPriceModel === 'spot' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <span className="material-icons text-2xl">trending_up</span>
                                        <span className="text-sm font-bold">电力现货市场 (Spot)</span>
                                        <span className="text-[10px] opacity-70">高波动性鸭子曲线拟合</span>
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* 2. Strategy Comparison */}
                        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="material-icons text-purple-600">calculate</span>
                                调度策略配置
                            </h3>

                            {mode === 'simple' ? (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex items-center gap-6">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm text-slate-400">
                                        <span className="material-icons text-2xl">lock</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 mb-1">标准分时套利 (Baseline)</h4>
                                        <p className="text-xs text-slate-500">快速测算模式下，系统默认采用标准的“两充两放”逻辑估算峰谷价差收益。</p>
                                    </div>
                                    <div className="ml-auto">
                                        <button onClick={() => setMode('advanced')} className="text-xs text-primary font-medium hover:underline">切换至精确估值以解锁 AI 策略 &rarr;</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div
                                        onClick={() => setStrategyType('baseline')}
                                        className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${strategyType === 'baseline' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500">
                                                    <span className="material-icons">schedule</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-800">方案 A: 基础分时策略</h4>
                                                    <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100">Baseline ToU</span>
                                                </div>
                                            </div>
                                            {strategyType === 'baseline' && <span className="material-icons text-primary">check_circle</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 mb-4 h-8">严格执行固定时段充放电，不考虑实时负荷波动与需量控制。</p>

                                        <div className="bg-white/50 rounded-lg p-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => setBaselineMode('2c2d')} className={`flex-1 py-1.5 text-xs rounded border transition-colors ${baselineMode === '2c2d' ? 'bg-white border-primary text-primary font-bold shadow-sm' : 'border-transparent text-slate-500 hover:bg-white'}`}>两充两放</button>
                                            <button onClick={() => setBaselineMode('1c1d')} className={`flex-1 py-1.5 text-xs rounded border transition-colors ${baselineMode === '1c1d' ? 'bg-white border-primary text-primary font-bold shadow-sm' : 'border-transparent text-slate-500 hover:bg-white'}`}>一充一放</button>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setStrategyType('ai')}
                                        className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${strategyType === 'ai' ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-200' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-purple-600">
                                                    <span className="material-icons">psychology</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-800">方案 B: AI 多目标协同</h4>
                                                    <span className="text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">Value Stacking</span>
                                                </div>
                                            </div>
                                            {strategyType === 'ai' && <span className="material-icons text-purple-600">check_circle</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 mb-4 h-8">叠加需量管理与动态寻优，最大化储能资产的综合收益。</p>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/60 rounded transition-colors" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={aiFeatures.dynamicPricing}
                                                    onChange={() => setAiFeatures({ ...aiFeatures, dynamicPricing: !aiFeatures.dynamicPricing })}
                                                    className="accent-purple-600 w-4 h-4 rounded"
                                                />
                                                <span className="text-xs font-medium text-slate-700">动态电价寻优 (Spot Market)</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/60 rounded transition-colors" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={aiFeatures.demandManagement}
                                                    onChange={() => setAiFeatures({ ...aiFeatures, demandManagement: !aiFeatures.demandManagement })}
                                                    className="accent-purple-600 w-4 h-4 rounded"
                                                />
                                                <span className="text-xs font-medium text-slate-700">需量管理 (Demand Charge Saving)</span>
                                            </label>
                                            <label className={`flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/60 rounded transition-colors ${!solarModule?.isActive && 'opacity-50 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={aiFeatures.pvSelfConsumption}
                                                    onChange={() => setAiFeatures({ ...aiFeatures, pvSelfConsumption: !aiFeatures.pvSelfConsumption })}
                                                    className="accent-purple-600 w-4 h-4 rounded"
                                                />
                                                <span className="text-xs font-medium text-slate-700">光伏余电消纳优先</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* 3. Visualization Chart */}
                        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <span className="material-icons text-blue-500">monitoring</span>
                                        24小时源网荷储运行模拟
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">展示储能动作与电价、负荷的耦合关系</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm"></span> 电价</div>
                                    {mode === 'advanced' && aiFeatures.pvSelfConsumption && <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-sm"></span> 光伏</div>}
                                    <div className="flex items-center gap-1"><span className="w-3 h-3 bg-primary rounded-sm"></span> 储能动作</div>
                                </div>
                            </div>
                            <StorageSimulationChart data={simulationData} mode={mode} hasPvSelfConsumption={aiFeatures.pvSelfConsumption} />
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
                            className="px-8 py-2.5 text-sm font-semibold rounded-xl bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover transition-all flex items-center gap-2"
                        >
                            保存配置 <span className="material-icons text-[18px]">save</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Analytics */}
            <aside className={`w-[340px] bg-white border-l border-slate-200 flex flex-col shrink-0 z-20 h-screen overflow-y-auto shadow-xl mb-16 transition-all duration-300 ${currentModule.isActive ? '' : 'opacity-60 grayscale'}`}>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-icons text-primary">analytics</span> 实时收益看板
                    </h3>
                    {!currentModule.isActive && <span className="text-xs font-bold text-red-500 border border-red-200 bg-red-50 px-2 py-0.5 rounded">未计入</span>}
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                    <div className="bg-primary p-4 rounded-xl shadow-lg shadow-primary/20 text-white relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl group-hover:bg-white/20 transition-all"></div>
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                            <div className="p-1.5 bg-white/20 rounded text-white"><span className="material-icons text-sm">account_balance_wallet</span></div>
                            <span className="text-xs font-semibold text-blue-100 uppercase">总投资 (Capex)</span>
                        </div>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-3xl font-bold tracking-tight">¥ {financials.investment.toFixed(1)}</span>
                            <span className="text-sm text-blue-100">万元</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100 rounded text-emerald-600"><span className="material-icons text-sm">savings</span></div>
                                <span className="text-xs font-semibold text-slate-500 uppercase">当前视角年收益</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xl font-bold text-slate-800">¥ {financials.investorRevenue.toFixed(1)} <span className="text-xs font-normal text-slate-400">万</span></span>
                                {investmentConfig.mode === 'emc' && (
                                    <span className="text-[10px] text-blue-500 font-medium">业主分账: {financials.ownerBenefit.toFixed(1)} 万</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span>峰谷套利</span>
                                    <span>¥ {financials.arbitrage.toFixed(1)} 万</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(financials.arbitrage / financials.totalSaving) * 100 || 0}%` }}></div>
                                </div>
                            </div>
                            {mode === 'advanced' && (
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span className="flex items-center gap-1">需量节省</span>
                                        <span>¥ {financials.demand.toFixed(1)} 万</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(financials.demand / financials.totalSaving) * 100 || 0}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-orange-100 rounded text-orange-600"><span className="material-icons text-sm">timelapse</span></div>
                            <span className="text-xs font-semibold text-slate-500 uppercase">静态回本周期</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900 tracking-tight">{financials.payback.toFixed(1)}</span>
                            <span className="text-sm text-slate-500">年</span>
                        </div>
                    </div>

                    {/* Financial Detail Trigger */}
                    <div
                        onClick={() => setIsChartExpanded(true)}
                        className="mt-4 p-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                        <div className="absolute right-0 top-0 w-16 h-16 bg-white/10 rounded-full -mr-4 -mt-4 blur-xl group-hover:bg-white/20 transition-all"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <span className="material-icons text-sm text-yellow-400">monetization_on</span> 收益详细分析
                                </h4>
                                <p className="text-[10px] text-slate-300 mt-1">查看 25 年现金流、IRR、回收期与各项税费结构</p>
                            </div>
                            <span className="material-icons text-white/50 group-hover:text-white transition-colors">chevron_right</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Expanded Math Modal */}
            {isChartExpanded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6" onClick={() => setIsChartExpanded(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[650px] shadow-2xl p-8 flex flex-col relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <span className="p-2 bg-purple-100 text-purple-600 rounded-lg"><span className="material-icons">monetization_on</span></span>
                                    储能系统 25年收益结构与财务分析
                                </h2>
                            </div>
                            <button onClick={() => setIsChartExpanded(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                <span className="material-icons text-2xl">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">项目总投资</p>
                                    <div className="text-2xl font-bold text-slate-900">¥ {financials.investment.toFixed(2)} <span className="text-sm font-normal text-slate-500">万</span></div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        {isEmc ? '投资方累计净收益' : '累计净收益'}
                                    </p>
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
                                    <div className="text-2xl font-bold text-purple-600">{(financials.irr * 100).toFixed(2)}%</div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">静态回收期</p>
                                    <div className="text-2xl font-bold text-orange-500">{financials.payback.toFixed(2)} <span className="text-sm font-normal text-slate-500">年</span></div>
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
                                            const cumulative = arr.slice(0, i + 1).reduce((sum: number, item: any) => sum + item.netIncome, -financials.investment);
                                            return { year: d.year, value: parseFloat(cumulative.toFixed(2)) };
                                        }) || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
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
                                            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCash)" />
                                            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-0 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                    <h3 className="text-sm font-bold text-slate-700">
                                        {isEmc ? '业主 vs 投资方 逐年收益明细 (25年)' : '测算数据明细 (25年)'}
                                    </h3>
                                    <span className="text-[10px] text-slate-400">单位: 万元 | 精度: 0.01</span>
                                </div>
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-5 py-4 sticky top-0 left-0 z-10 bg-slate-50 min-w-[100px]">运营年份</th>
                                            <th className="px-5 py-4 sticky top-0 bg-slate-50 text-right min-w-[140px]">
                                                {isEmc ? '投资方营收' : '总营收'}
                                            </th>
                                            {isEmc && <th className="px-5 py-4 sticky top-0 bg-slate-50 text-right text-blue-600 min-w-[120px]">业主收益</th>}
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
                                                    首年全投资产生的进项税先全额留抵。<br />后每年 <b>销项税-进项税-上期留抵</b>，<br />不足扣的填0。<br />仅在大于0时缴纳{projectBaseInfo?.vatExtraRate ?? 6.0}%的城市维护及教育附加税。
                                                </div>
                                            </th>
                                            <th className="px-5 py-4 sticky top-0 bg-slate-50 text-right min-w-[140px] group relative cursor-help">
                                                所得税费
                                                <span className="material-icons absolute top-3 right-1 text-slate-400 text-xs text-opacity-70 group-hover:text-primary transition-colors">info</span>
                                                <div className="absolute top-12 right-0 w-64 bg-slate-800 text-white text-[10px] p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-50 text-left pointer-events-none break-normal whitespace-pre-line font-normal">
                                                    <span className="font-bold text-orange-300 block mb-1">折旧/利润抵扣说明 (DDB)：</span>
                                                    采用10年双倍余额递减法折旧。<br />
                                                    应缴所得利润 = 不含税收入 - 不含税各项成本 - 本年度折旧。<br />
                                                    最终税率 {projectBaseInfo?.taxRate ?? 5.0}%.
                                                </div>
                                            </th>
                                            <th className="px-5 py-4 sticky top-0 z-10 bg-slate-50/50 text-right font-bold text-slate-700 min-w-[140px] border-l border-slate-200">
                                                {isEmc ? '投资方净现金流' : '总净现金流'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 tracking-tight">
                                        <tr className="hover:bg-slate-50 bg-slate-50/30">
                                            <td className="px-5 py-3 font-bold text-slate-700 sticky left-0 bg-slate-50/30">第 0 年 (投资)</td>
                                            <td className="px-5 py-3 text-right text-slate-400">-</td>
                                            {isEmc && <td className="px-5 py-3 text-right text-slate-400">-</td>}
                                            <td className="px-5 py-3 text-right text-slate-400">-</td>
                                            <td className="px-5 py-3 text-right text-slate-400">-</td>
                                            <td className="px-5 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                            <td className="px-5 py-3 text-right text-slate-400">-</td>
                                            <td className="px-5 py-3 text-right font-bold text-red-500 border-l border-slate-100">
                                                -{financials.investment.toFixed(2)}
                                            </td>
                                        </tr>
                                        {financials.yearlyDetails?.map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3 font-medium text-slate-700 sticky left-0 bg-white">第 {row.year} 年</td>
                                                <td className="px-5 py-3 text-right text-orange-600 font-medium font-mono border-r border-slate-100">{row.revenue.toFixed(2)}</td>
                                                {isEmc && <td className="px-5 py-3 text-right text-blue-600 font-medium font-mono">{row.ownerBenefit.toFixed(2)}</td>}

                                                {/* Cost section separated */}
                                                <td className="px-5 py-3 text-right text-slate-500 font-mono">-{row.om.toFixed(2)}</td>
                                                <td className="px-5 py-3 text-right text-slate-500 font-mono">-{row.insurance.toFixed(2)}</td>

                                                {/* Tax section separated */}
                                                <td className="px-5 py-3 text-right text-red-400 font-mono border-l border-slate-100">
                                                    -{(row.tax - row.incomeTax).toFixed(2)}
                                                </td>
                                                <td className="px-5 py-3 text-right text-red-500 font-mono">
                                                    -{row.incomeTax.toFixed(2)}
                                                </td>

                                                <td className={`px-5 py-3 text-right font-bold bg-slate-50/30 font-mono border-l border-slate-100 ${row.netIncome >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {row.netIncome.toFixed(2)}
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

export default RetrofitStorage;
