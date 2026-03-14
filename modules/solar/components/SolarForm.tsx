import React, { useState } from 'react';
import { getSchoolTypeName } from '../../../services/campusConsumption';
import { SolarParamsState, BuildingData, InvestmentMode, EmcSubMode } from '../types';
import { useProject } from '../../../context/ProjectContext';

interface SolarFormProps {
    params: SolarParamsState;
    handleUpdate: (updates: Partial<SolarParamsState>) => void;
    buildings: BuildingData[];
    setBuildings: React.Dispatch<React.SetStateAction<BuildingData[]>>;
    transformers: any[];
    bills: any[];
    projectBaseInfo: any;
    currentModule: any;
    selfUseMode: 'auto' | 'manual';
    setSelfUseMode: (val: 'auto' | 'manual') => void;
    calculatedSelfConsumption: number;
    setCalculatedSelfConsumption: (val: number) => void;
    consumptionResult: any;
    storageModule: any;
}

export const SolarForm: React.FC<SolarFormProps> = ({
    params, handleUpdate, buildings, setBuildings, transformers, bills,
    projectBaseInfo, currentModule, selfUseMode, setSelfUseMode,
    calculatedSelfConsumption, setCalculatedSelfConsumption, consumptionResult, storageModule
}) => {
    const { setProjectBaseInfo } = useProject();
    const [showConsumptionDetail, setShowConsumptionDetail] = useState(false);

    const toggleBuilding = (id: number) => {
        setBuildings(buildings.map(b => b.id === id ? { ...b, active: !b.active } : b));
    };

    const updateBuildingCapacity = (id: number, val: number) => {
        setBuildings(buildings.map(b => b.id === id ? { ...b, manualCapacity: val } : b));
    };

    const updateBuildingTransformer = (id: number, val: number) => {
        setBuildings(buildings.map(b => b.id === id ? { ...b, transformerId: val } : b));
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Mode Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">参数配置</h3>
                    <p className="text-xs text-slate-500 mt-1">请选择估值模式并录入关键参数</p>
                </div>
                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
                    <button
                        onClick={() => handleUpdate({ mode: 'simple' })}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${params.mode === 'simple' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <span className="material-icons text-[16px]">speed</span> 快速估值
                    </button>
                    <button
                        onClick={() => handleUpdate({ mode: 'advanced' })}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${params.mode === 'advanced' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <span className="material-icons text-[16px]">tune</span> 精确测算
                    </button>
                </div>
            </div>

            {/* --- SIMPLE MODE UI --- */}
            {params.mode === 'simple' && (
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                    <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <span className="material-icons text-orange-500">design_services</span> 设计参数
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500">关联接入点</label>
                            <select
                                value={params.simpleParams.connectionPoint}
                                onChange={(e) => handleUpdate({ simpleParams: { ...params.simpleParams, connectionPoint: Number(e.target.value) } })}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-primary"
                            >
                                {transformers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                {transformers.length === 0 && <option value={0}>默认接入点</option>}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500">安装面积 (㎡)</label>
                            <input
                                type="number"
                                value={params.simpleParams.area}
                                onChange={(e) => handleUpdate({ simpleParams: { ...params.simpleParams, area: parseFloat(e.target.value) } })}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-primary"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500">拟装机容量 (kWp)</label>
                            <input
                                type="number"
                                value={params.simpleParams.capacity}
                                onChange={(e) => handleUpdate({ simpleParams: { ...params.simpleParams, capacity: parseFloat(e.target.value) } })}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-primary"
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* --- ADVANCED MODE UI --- */}
            {params.mode === 'advanced' && (
                <>
                    {/* 1. Connection & Self-Consumption Analysis */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                        <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <span className="material-icons text-blue-500">analytics</span> 接入与消纳分析
                        </h3>
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Left: Info Cards */}
                            <div className="flex-1 w-full space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-700">综合电价 (光伏时段加权)</span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">自动计算</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-primary">{params.advParams.electricityPrice.toFixed(4)}</span>
                                        <span className="text-sm text-slate-500">元/kWh</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">基于 8:00 - 17:00 的电网平均电价</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700 flex justify-between items-center">
                                    <span>历史年总用电量 (Bill Data)</span>
                                    <span className="font-bold">{bills.length > 0 ? bills.reduce((acc: any, b: any) => acc + b.kwh, 0).toLocaleString() : '暂无数据'} kWh</span>
                                </div>
                            </div>

                            {/* Right: Self Consumption Config */}
                            <div className="flex-1 w-full bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-sm font-bold text-slate-800 block">预估光伏消纳率</span>
                                        <span className="text-xs text-slate-400">决定了电费收益与上网收益的比例</span>
                                    </div>
                                    <div className="flex bg-white p-0.5 rounded-lg border border-slate-200">
                                        <button
                                            onClick={() => setSelfUseMode('auto')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${selfUseMode === 'auto' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            自动测算
                                        </button>
                                        <button
                                            onClick={() => setSelfUseMode('manual')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${selfUseMode === 'manual' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            手动设置
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                            <path className="text-slate-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                                            <path className="text-primary transition-all duration-1000" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${calculatedSelfConsumption}, 100`} strokeWidth="3"></path>
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-xl font-bold text-slate-800">{calculatedSelfConsumption}%</span>
                                            <span className="text-[9px] text-slate-400">自用比例</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        {selfUseMode === 'auto' ? (
                                            <div className="text-xs text-slate-500 space-y-1">
                                                {projectBaseInfo.type === 'school' ? (
                                                    <>
                                                        <p className="flex items-center gap-1">
                                                            <span className="material-icons text-[12px] text-blue-500">school</span>
                                                            <span><span className="font-bold text-slate-700">{getSchoolTypeName(projectBaseInfo.schoolType || 'university')}</span>消纳率预估</span>
                                                        </p>
                                                        <p>基于学校类型、储容比、空调配置、节假日等因素综合计算</p>
                                                        <button
                                                            onClick={() => setShowConsumptionDetail(!showConsumptionDetail)}
                                                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                                                        >
                                                            <span className="material-icons text-[14px]">info</span>
                                                            {showConsumptionDetail ? '隐藏详情' : '查看详情'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p>基于<span className="font-bold text-slate-700">月度用电量</span>与<span className="font-bold text-slate-700">模拟发电量</span>匹配计算。</p>
                                                        <p className="flex items-center gap-1"><span className="material-icons text-[12px] text-blue-500">info</span> {bills.length > 0 ? '已关联 12 个月电费单数据' : '未检测到电费单，默认100%'}</p>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-3 pt-2">
                                                <input
                                                    type="range" min="0" max="100"
                                                    value={calculatedSelfConsumption}
                                                    onChange={(e) => setCalculatedSelfConsumption(Number(e.target.value))}
                                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                                <div className="flex justify-between text-xs text-slate-400">
                                                    <span>全额上网 (0%)</span>
                                                    <span>全额自用 (100%)</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 校园消纳率详情面板 */}
                            {showConsumptionDetail && consumptionResult && projectBaseInfo.type === 'school' && (
                                <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 w-full lg:w-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <span className="material-icons text-blue-500">assessment</span>
                                            消纳率计算详情
                                        </h4>
                                        <button
                                            onClick={() => setShowConsumptionDetail(false)}
                                            className="text-slate-400 hover:text-slate-600"
                                        >
                                            <span className="material-icons">close</span>
                                        </button>
                                    </div>

                                    {/* 主要结果 */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-[10px] text-slate-500 mb-1">最终推荐消纳率</p>
                                            <p className="text-2xl font-bold text-primary">{(consumptionResult.recommendedRate * 100).toFixed(2)}%</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-[10px] text-slate-500 mb-1">考虑节假日后</p>
                                            <p className="text-2xl font-bold text-blue-600">{(consumptionResult.vacationAdjustedRate * 100).toFixed(2)}%</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-[10px] text-slate-500 mb-1">考虑周末后</p>
                                            <p className="text-2xl font-bold text-green-600">{(consumptionResult.weekendAdjustedRate * 100).toFixed(2)}%</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-[10px] text-slate-500 mb-1">储容比</p>
                                            <p className="text-lg font-bold text-slate-800">{((storageModule?.params?.capacity || 0) / (params.simpleParams.capacity || 1)).toFixed(2)}</p>
                                        </div>
                                    </div>
                                    {/* 季节消纳率 */}
                                    <div className="bg-white rounded-lg p-4 mb-4">
                                        <h5 className="text-xs font-bold text-slate-700 mb-3">季节消纳率对比</h5>
                                        <div className="grid grid-cols-4 gap-3">
                                            {[
                                                { name: '春季', rate: consumptionResult.seasonalRates.spring, color: 'text-green-600' },
                                                { name: '夏季', rate: consumptionResult.seasonalRates.summer, color: 'text-red-600' },
                                                { name: '秋季', rate: consumptionResult.seasonalRates.autumn, color: 'text-amber-600' },
                                                { name: '冬季', rate: consumptionResult.seasonalRates.winter, color: 'text-blue-600' }
                                            ].map((season) => (
                                                <div key={season.name} className="text-center">
                                                    <p className="text-xs text-slate-500 mb-1">{season.name}</p>
                                                    <p className={`text-lg font-bold ${season.color}`}>{(season.rate * 100).toFixed(2)}%</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* 计算说明 */}
                                    <div className="bg-white rounded-lg p-4">
                                        <h5 className="text-xs font-bold text-slate-700 mb-3">计算说明</h5>
                                        <div className="space-y-2">
                                            {consumptionResult.explanation.map((exp: string, i: number) => (
                                                <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="material-icons text-[14px] text-blue-500 mt-0.5">check_circle</span>
                                                    <span>{exp}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 2. Building Details */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                        <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="flex items-center gap-2"><span className="material-icons text-purple-500">domain</span> 楼栋铺设详情</span>
                            <span className="text-xs font-normal text-slate-500 bg-slate-50 px-2 py-1 rounded">合计容量: {buildings.filter(b => b.active).reduce((a, b) => a + b.manualCapacity, 0).toFixed(2)} kWp</span>
                        </h3>
                        <div className="space-y-3">
                            {buildings.map((b) => (
                                <div key={b.id} className={`flex flex-col md:flex-row md:items-center gap-4 p-3 rounded-lg border transition-all ${b.active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                    <div className="flex items-center gap-3 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={b.active}
                                            onChange={() => toggleBuilding(b.id)}
                                            className="w-5 h-5 accent-primary cursor-pointer shrink-0"
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-800">{b.name}</div>
                                            <div className="text-xs text-slate-500">可用面积: {b.area} ㎡</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="flex items-center gap-2 flex-1 md:flex-initial">
                                            <label className="text-xs text-slate-400 whitespace-nowrap">拟装容量:</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={b.manualCapacity}
                                                    onChange={(e) => updateBuildingCapacity(b.id, parseFloat(e.target.value))}
                                                    disabled={!b.active}
                                                    className="w-24 px-2 py-1.5 text-sm text-right bg-white border border-slate-200 rounded-md focus:border-primary outline-none"
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-slate-600">kWp</span>
                                        </div>

                                        <div className="flex items-center gap-2 flex-1 md:flex-initial">
                                            <label className="text-xs text-slate-400 whitespace-nowrap">接入变压器:</label>
                                            <div className="relative">
                                                <select
                                                    value={b.transformerId}
                                                    onChange={(e) => updateBuildingTransformer(b.id, Number(e.target.value))}
                                                    disabled={!b.active}
                                                    className="w-32 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:border-primary outline-none appearance-none cursor-pointer text-slate-700"
                                                >
                                                    {transformers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                    <option value={0}>默认接入点</option>
                                                </select>
                                                <span className="material-icons absolute right-1 top-1.5 text-slate-400 pointer-events-none text-[14px]">expand_more</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3. Detailed Parameters (Groups) */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                        <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <span className="material-icons text-emerald-500">tune</span> 深度财务与工程参数
                        </h3>
                        <div className="space-y-6">
                            {/* Group 1: Engineering & Design */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">系统设计参数</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs text-slate-500">日照时长 (h/day)</label>
                                            <button
                                                onClick={() => setProjectBaseInfo({ ...projectBaseInfo, isSolarManualOverride: !projectBaseInfo.isSolarManualOverride })}
                                                className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${projectBaseInfo.isSolarManualOverride ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                                                title={projectBaseInfo.isSolarManualOverride ? "已开启人工覆盖" : "自动同步 NASA/预设数据"}
                                            >
                                                <span className="material-icons text-[12px]">{projectBaseInfo.isSolarManualOverride ? 'lock_open' : 'lock'}</span>
                                                {projectBaseInfo.isSolarManualOverride ? '人工' : '自动'}
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={params.advParams.dailySunHours}
                                                disabled={!projectBaseInfo.isSolarManualOverride}
                                                onChange={(e) => handleUpdate({ advParams: { ...params.advParams, dailySunHours: parseFloat(e.target.value) || 0 } })}
                                                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-all ${!projectBaseInfo.isSolarManualOverride
                                                    ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                                                    : 'bg-white text-slate-700 border-slate-200 focus:border-primary'
                                                    }`}
                                            />
                                            {projectBaseInfo.nasaSolarData && !projectBaseInfo.isSolarManualOverride && (
                                                <div className="absolute -top-6 right-0 scale-0 group-hover:scale-100 transition-transform origin-bottom-right bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
                                                    来源: NASA 官方卫星数据
                                                </div>
                                            )}
                                        </div>
                                        {/* NASA 月度分布小卡片 */}
                                        {projectBaseInfo.nasaMonthlyHours && projectBaseInfo.nasaMonthlyHours.length === 12 && (
                                            <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                        <span className="material-icons text-[12px]">wb_sunny</span> NASA 月度分布参考
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-6 gap-0.5">
                                                    {projectBaseInfo.nasaMonthlyHours.map((v: number, i: number) => (
                                                        <div key={i} className="flex flex-col items-center">
                                                            <div
                                                                className="w-full bg-yellow-400/20 rounded-t-[1px] relative"
                                                                style={{ height: `${Math.min(v / 8, 1) * 15}px`, minHeight: '2px' }}
                                                            >
                                                                <div className="absolute inset-x-0 bottom-0 bg-yellow-500 rounded-t-[1px]" style={{ height: '2px' }}></div>
                                                            </div>
                                                            <span className="text-[8px] text-slate-400 mt-0.5">{i + 1}月</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">系统综合效率 (%)</label>
                                        <input type="number" value={params.advParams.prValue} onChange={(e) => handleUpdate({ advParams: { ...params.advParams, prValue: parseFloat(e.target.value) } })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">非正南角度效率 (%)</label>
                                        <input type="number" value={params.advParams.azimuthEfficiency} onChange={(e) => handleUpdate({ advParams: { ...params.advParams, azimuthEfficiency: parseFloat(e.target.value) } })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">年发电天数 (天)</label>
                                        <input type="number" value={params.advParams.generationDays} onChange={(e) => handleUpdate({ advParams: { ...params.advParams, generationDays: parseFloat(e.target.value) } })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary" />
                                    </div>
                                </div>
                            </div>

                            {/* Group 2: Degradation */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">组件衰减配置</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">首年衰减率 (%)</label>
                                        <input type="number" step="0.1" value={params.advParams.degradationFirstYear} onChange={(e) => handleUpdate({ advParams: { ...params.advParams, degradationFirstYear: parseFloat(e.target.value) } })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">次年起逐年衰减 (%)</label>
                                        <input type="number" step="0.05" value={params.advParams.degradationLinear} onChange={(e) => handleUpdate({ advParams: { ...params.advParams, degradationLinear: parseFloat(e.target.value) } })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary" />
                                    </div>
                                </div>
                            </div>

                            {/* Group 3: Financials */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">财务模型参数</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">上网电价 (元/kWh)</label>
                                        <input type="number" value={params.advParams.feedInTariff} step="0.01" onChange={(e) => handleUpdate({ advParams: { ...params.advParams, feedInTariff: parseFloat(e.target.value) } })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">基准电价 (元/kWh)</label>
                                        <input type="number" value={params.advParams.electricityPrice} step="0.01" onChange={(e) => handleUpdate({ advParams: { ...params.advParams, electricityPrice: parseFloat(e.target.value) } })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">运维费 (元/W/年)</label>
                                        <input type="number" value={params.advParams.omCost} step="0.01" onChange={(e) => handleUpdate({ advParams: { ...params.advParams, omCost: parseFloat(e.target.value) } })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">综合税率 (%)</label>
                                        <input type="number" value={params.advParams.taxRate} step="0.1" onChange={(e) => handleUpdate({ advParams: { ...params.advParams, taxRate: parseFloat(e.target.value) } })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary font-bold text-slate-700" />
                                    </div>
                                </div>
                            </div>

                            {/* Group 4: EMC 合同能源管理专项 (Conditional) */}
                            {params.simpleParams.investmentMode === 'emc' && (
                                <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                                    <h4 className="text-xs font-bold text-orange-800 uppercase mb-4 flex items-center gap-1">
                                        <span className="material-icons text-[14px]">handshake</span> EMC 合同能源管理专项
                                    </h4>

                                    {/* 角色说明 */}
                                    <div className="flex gap-3 mb-4">
                                        <div className="flex-1 p-2.5 bg-white rounded-lg border border-orange-100">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                <span className="text-[10px] font-bold text-slate-600">业主方</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400">提供屋顶资源，享受电价优惠或收益分成，收取屋顶租金</p>
                                        </div>
                                        <div className="flex-1 p-2.5 bg-white rounded-lg border border-orange-100">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                                <span className="text-[10px] font-bold text-slate-600">投资方 (EMC公司)</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400">负责投资建设、运维管理，承担投资风险，获取电费收益</p>
                                        </div>
                                    </div>

                                    {/* 子模式切换：收益分成 vs 折扣电价 (二选一) */}
                                    <div className="mb-4">
                                        <label className="text-xs font-bold text-orange-700 mb-2 block">结算方式 (二选一)</label>
                                        <div className="flex gap-2 p-1 bg-orange-100/60 rounded-lg">
                                            <button
                                                onClick={() => handleUpdate({ simpleParams: { ...params.simpleParams, emcSubMode: 'sharing' } })}
                                                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${params.simpleParams.emcSubMode === 'sharing'
                                                    ? 'bg-white text-orange-700 shadow-sm border border-orange-200'
                                                    : 'text-orange-500/70 hover:text-orange-700'
                                                    }`}
                                            >
                                                <span className="material-icons text-[14px]">pie_chart</span>
                                                收益分成模式
                                            </button>
                                            <button
                                                onClick={() => handleUpdate({ simpleParams: { ...params.simpleParams, emcSubMode: 'discount' } })}
                                                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${params.simpleParams.emcSubMode === 'discount'
                                                    ? 'bg-white text-orange-700 shadow-sm border border-orange-200'
                                                    : 'text-orange-500/70 hover:text-orange-700'
                                                    }`}
                                            >
                                                <span className="material-icons text-[14px]">sell</span>
                                                折扣电价模式
                                            </button>
                                        </div>
                                    </div>

                                    {/* 条件参数区域 */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {params.simpleParams.emcSubMode === 'sharing' ? (
                                            /* 收益分成模式参数 */
                                            <div className="space-y-1">
                                                <label className="text-xs text-orange-700 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    业主分成比例 (%)
                                                </label>
                                                <input
                                                    type="number" step="1"
                                                    value={params.advParams.emcOwnerShareRate}
                                                    onChange={(e) => handleUpdate({ advParams: { ...params.advParams, emcOwnerShareRate: parseFloat(e.target.value) } })}
                                                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm outline-none focus:border-orange-400 font-bold"
                                                />
                                                <p className="text-[10px] text-orange-400">业主获得自用电费收益的 {params.advParams.emcOwnerShareRate}%，投资方获 {100 - params.advParams.emcOwnerShareRate}%</p>
                                            </div>
                                        ) : (
                                            /* 折扣电价模式参数 */
                                            <div className="space-y-1">
                                                <label className="text-xs text-orange-700 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                                    投资方售电价 (元/kWh)
                                                </label>
                                                <input
                                                    type="number" step="0.01"
                                                    value={params.advParams.emcDiscountPrice}
                                                    onChange={(e) => handleUpdate({ advParams: { ...params.advParams, emcDiscountPrice: parseFloat(e.target.value) } })}
                                                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm outline-none focus:border-orange-400 font-bold"
                                                />
                                                <p className="text-[10px] text-orange-400">
                                                    市电价 {params.advParams.electricityPrice} 元, 业主每度省{' '}
                                                    <span className="font-bold text-emerald-600">
                                                        {(params.advParams.electricityPrice - params.advParams.emcDiscountPrice).toFixed(2)}
                                                    </span> 元
                                                </p>
                                            </div>
                                        )}

                                        {/* 通用: 屋顶租金 */}
                                        <div className="space-y-1">
                                            <label className="text-xs text-orange-700 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                屋顶租金 (元/㎡/年)
                                            </label>
                                            <input
                                                type="number" step="0.5"
                                                value={params.advParams.roofRent}
                                                onChange={(e) => handleUpdate({ advParams: { ...params.advParams, roofRent: parseFloat(e.target.value) } })}
                                                className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm outline-none focus:border-orange-400"
                                            />
                                            <p className="text-[10px] text-orange-400">业主收 → 投资方付 | 年化约 {(params.simpleParams.area * params.advParams.roofRent / 10000).toFixed(2)} 万元</p>
                                        </div>

                                        {/* 预计对比 */}
                                        <div className="space-y-1 bg-white/70 p-3 rounded-lg border border-orange-100">
                                            <span className="text-[10px] font-bold text-slate-500 block mb-1">业主 vs 投资方 (首年预估)</span>
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                <span className="text-[10px] text-slate-600">业主收益: <span className="font-bold text-blue-600">自动计算</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                                <span className="text-[10px] text-slate-600">投资方收益: <span className="font-bold text-orange-600">自动计算</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}

            {/* Common Investment Section */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
                <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="material-icons text-red-500">paid</span> 投资与商业模式
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="space-y-1.5 lg:col-span-4">
                        <label className="text-xs font-semibold text-slate-500">商业/投资模式</label>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl shadow-inner">
                            {[
                                { id: 'emc', label: 'EMC 节能分成', icon: 'handshake' },
                                { id: 'epc', label: 'EPC 工程总包', icon: 'construction' }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => handleUpdate({ simpleParams: { ...params.simpleParams, investmentMode: mode.id as InvestmentMode } })}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all ${params.simpleParams.investmentMode === mode.id ? 'bg-white text-primary shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                >
                                    <span className="material-icons text-[18px]">{mode.icon}</span>
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={`col-span-1 lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 rounded-xl border border-slate-200 mt-2 ${params.simpleParams.investmentMode === 'emc' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100' : 'bg-white'}`}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">投入成本划分 (万元)</label>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">建议合计: {(currentModule?.investment || 0).toFixed(2)} 万</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 bg-white/50 p-4 rounded-lg border border-slate-100 italic">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 block">组件/支架</label>
                                    <input type="number" value={params.advParams.hardwareCost} onChange={(e) => handleUpdate({ advParams: { ...params.advParams, hardwareCost: parseFloat(e.target.value) || 0 } })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-emerald-500 font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 block">逆变器/电气</label>
                                    <input type="number" value={params.advParams.inverterCost} onChange={(e) => handleUpdate({ advParams: { ...params.advParams, inverterCost: parseFloat(e.target.value) || 0 } })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-emerald-500 font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 block">施工/安装</label>
                                    <input type="number" value={params.advParams.installCost} onChange={(e) => handleUpdate({ advParams: { ...params.advParams, installCost: parseFloat(e.target.value) || 0 } })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-emerald-500 font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 block">并网/土建</label>
                                    <input type="number" value={params.advParams.civilCost} onChange={(e) => handleUpdate({ advParams: { ...params.advParams, civilCost: parseFloat(e.target.value) || 0 } })} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-emerald-500 font-bold" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">收益分配比例</label>
                            <div className="p-5 bg-white rounded-xl border border-slate-100 flex-1 h-full flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-emerald-800">甲方(业主)分成比例</label>
                                    <span className="text-lg font-black text-emerald-600">{params.advParams.emcOwnerShareRate}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="100" step="1"
                                    value={params.advParams.emcOwnerShareRate}
                                    onChange={(e) => handleUpdate({ advParams: { ...params.advParams, emcOwnerShareRate: parseFloat(e.target.value) } })}
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
        </div>
    );
};
