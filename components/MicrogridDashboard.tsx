import React, { useState } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { useProject } from '../context/ProjectContext';
import MicrogridVisual from './microgrid/MicrogridVisual';
import { useSimulationData, useDynamicSimulation, PriceData, FinancialParams } from './hooks/useSimulationHooks';

type ScenarioType = 'normal' | 'peak-shaving' | 'extreme-price' | 'price-arbitrage';

const SCENARIOS = [
    { id: 'normal', name: '正常运营', description: '标准8760小时运行模式' },
    { id: 'peak-shaving', name: '高峰避峰', description: 'AI在高峰电价时段减少用能，降低峰期电费' },
    { id: 'extreme-price', name: '极端电价', description: 'AI在高电价时段主动削减用能，降低成本' },
    { id: 'price-arbitrage', name: '价格套利', description: '储能谷充峰放，利用峰谷价差获取收益' }
];

export default function MicrogridDashboard() {
    const { modules, toggleModule } = useProject();
    const currentModule = modules['retrofit-ai'];
    const savedParams = currentModule.params || {};

    // 统一参数状态
    const [useSpotPrice, setUseSpotPrice] = useState<boolean>(savedParams.useSpotPrice || false);
    const [importedPriceData, setImportedPriceData] = useState<PriceData[]>([]);
    const [importFileName, setImportFileName] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [showImportError, setShowImportError] = useState(false);
    const [importErrorMessage, setImportErrorMessage] = useState('');
    const [aiEnabled, setAiEnabled] = useState(false);
    const [aiAggressiveness, setAiAggressiveness] = useState<number>(savedParams.aiAggressiveness || 50);
    const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('normal');
    const [currentHour, setCurrentHour] = useState<number>(12);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // 金融参数状态
    const [investment, setInvestment] = useState<number>(savedParams.investment || 35.0);
    const [opex, setOpex] = useState<number>(savedParams.opex || 1.5);
    const [analysisPeriod, setAnalysisPeriod] = useState<number>(10);

    // 获取仿真数据
    const simulation = useSimulationData(
        useSpotPrice,
        importedPriceData,
        { investment, opex, analysisPeriod },
        modules
    );
    const dynamicSimulation = useDynamicSimulation(selectedScenario, aiEnabled, aiAggressiveness, modules);

    const currentHourData = simulation.data[currentHour] || simulation.data[12];

    if (!currentModule) return null;

    return (
        <div className="flex h-full flex-col bg-slate-50 relative overflow-hidden">
            {/* 顶部控制栏 */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-icons text-indigo-600 text-xl">dashboard</span>
                    <h2 className="text-lg font-bold text-slate-900">微电网综合仪表盘</h2>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                    <span className={`text-xs font-bold ${currentModule.isActive ? 'text-primary' : 'text-slate-400'}`}>
                        {currentModule.isActive ? '模块已启用' : '模块已停用'}
                    </span>
                    <button
                        onClick={() => toggleModule('retrofit-ai')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${currentModule.isActive ? 'bg-primary' : 'bg-slate-300'}`}
                    >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${currentModule.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-4 animate-fade-in">
                <div className="w-full h-full relative">

                    {/* 满铺：微电网可视化 */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[calc(100vh-140px)]">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-icons text-blue-500">grid_view</span>
                            <h3 className="text-base font-bold text-slate-800">微电网可视化</h3>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-slate-100 flex-1 min-h-0 relative">
                            <MicrogridVisual rightSidebarContent={
                                <div className="flex flex-col gap-3 p-3">

                                    {/* ── 情景选择 ── */}
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="material-icons text-indigo-400 text-sm">tune</span>
                                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">运行情景</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {SCENARIOS.map((scenario) => (
                                                <button
                                                    key={scenario.id}
                                                    onClick={() => setSelectedScenario(scenario.id as any)}
                                                    className={`px-2 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 border ${selectedScenario === scenario.id
                                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-300/30'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                                                        }`}
                                                >
                                                    {scenario.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ── 分割线 ── */}
                                    <div className="border-t border-slate-100"></div>

                                    {/* ── AI 智控 + 精度滑块 ── */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-icons text-indigo-400 text-sm">psychology</span>
                                                <span className="text-[11px] font-semibold text-slate-600">AI 智控</span>
                                            </div>
                                            <button
                                                onClick={() => setAiEnabled(!aiEnabled)}
                                                className={`relative inline-flex h-[18px] w-[34px] items-center rounded-full transition-colors duration-200 ${aiEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                            >
                                                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${aiEnabled ? 'translate-x-[16px]' : 'translate-x-[2px]'}`}></span>
                                            </button>
                                        </div>
                                        <div className={`transition-all duration-200 ${aiEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] text-slate-400">精度</span>
                                                <span className="text-[10px] font-bold text-indigo-600">{aiAggressiveness}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100"
                                                value={aiAggressiveness}
                                                onChange={(e) => setAiAggressiveness(parseInt(e.target.value))}
                                                className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>
                                    </div>

                                    {/* ── 分割线 ── */}
                                    <div className="border-t border-slate-100"></div>

                                    {/* ── 动态电价 ── */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-icons text-amber-500 text-sm">bolt</span>
                                                <span className="text-[11px] font-semibold text-slate-600">动态电价</span>
                                            </div>
                                            <button
                                                onClick={() => setUseSpotPrice(!useSpotPrice)}
                                                className={`relative inline-flex h-[18px] w-[34px] items-center rounded-full transition-colors duration-200 ${useSpotPrice ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                            >
                                                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${useSpotPrice ? 'translate-x-[16px]' : 'translate-x-[2px]'}`}></span>
                                            </button>
                                        </div>

                                        {useSpotPrice && (
                                            <div>
                                                {importedPriceData.length === 0 ? (
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isImporting}
                                                        className="w-full py-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-[10px] font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 active:scale-[0.98] transition-all"
                                                    >
                                                        {isImporting ? '导入中...' : '+ 导入电价文件'}
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-between px-2 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                                                        <span className="text-[10px] text-emerald-700 font-semibold truncate mr-2">{importFileName}</span>
                                                        <button onClick={() => setImportedPriceData([])} className="text-emerald-400 hover:text-red-400 transition-colors">
                                                            <span className="material-icons text-[13px]">close</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv,.json"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setIsImporting(true);
                                                setImportFileName(file.name);
                                                try {
                                                    const text = await file.text();
                                                    let data: any[] = [];
                                                    if (file.name.endsWith('.json')) data = JSON.parse(text);
                                                    else {
                                                        const lines = text.split('\n');
                                                        data = lines.slice(1).map(l => {
                                                            const [h, p] = l.split(',');
                                                            return { hour: parseInt(h), price: parseFloat(p) };
                                                        });
                                                    }
                                                    setImportedPriceData(data.filter(d => !isNaN(d.hour) && !isNaN(d.price)));
                                                } catch (e) { console.error(e); }
                                                finally { setIsImporting(false); }
                                            }}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* ── 分割线 ── */}
                                    <div className="border-t border-slate-100"></div>

                                    {/* ── 实时能效曲线 ── */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-icons text-blue-400 text-sm">show_chart</span>
                                                <span className="text-[11px] font-semibold text-slate-600">实时能效曲线</span>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                {currentHour}:00
                                            </span>
                                        </div>

                                        <div className="h-36 -mx-1">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart
                                                    data={dynamicSimulation.states.map((s, i) => ({
                                                        hour: i,
                                                        hourLabel: `${i}:00`,
                                                        baseLoad: simulation.data[i]?.baseLoad || 0,
                                                        aiLoad: simulation.data[i]?.aiLoad || 0,
                                                        price: simulation.data[i]?.price || 0,
                                                        pvPower: s.pvPower,
                                                        batteryPower: s.batteryPower,
                                                        load: s.load
                                                    }))}
                                                    onMouseMove={(e) => {
                                                        if (e.activeTooltipIndex !== undefined) {
                                                            setCurrentHour(Number(e.activeTooltipIndex));
                                                        }
                                                    }}
                                                >
                                                    <defs>
                                                        <linearGradient id="gradPv" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.35} />
                                                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.02} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="hourLabel" hide />
                                                    <YAxis hide />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '6px 8px', fontSize: '10px' }}
                                                        itemStyle={{ fontSize: '10px', padding: '1px 0' }}
                                                        labelStyle={{ display: 'none' }}
                                                    />
                                                    <Area type="monotone" dataKey="pvPower" stroke="#f59e0b" strokeWidth={1.5} fill="url(#gradPv)" name="光伏" />
                                                    <Line type="monotone" dataKey="baseLoad" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} name="基础负载" />
                                                    <Line type="monotone" dataKey="aiLoad" stroke="#6366f1" strokeWidth={2} dot={false} name="AI优化" />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* 图例 */}
                                        <div className="flex items-center justify-center gap-4 mt-1.5">
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-[2px] bg-amber-400 rounded"></div>
                                                <span className="text-[9px] text-slate-400">光伏</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-[2px] bg-slate-400 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #94a3b8 0 3px, transparent 3px 6px)' }}></div>
                                                <span className="text-[9px] text-slate-400">基础</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-[2px] bg-indigo-500 rounded"></div>
                                                <span className="text-[9px] text-slate-400">AI</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            } />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

