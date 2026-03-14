import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, LineChart, Line, Legend } from 'recharts';
import { SolarParamsState } from '../types';

interface SolarChartsProps {
    isChartExpanded: boolean;
    setIsChartExpanded: (val: boolean) => void;
    isFinancialModalOpen: boolean;
    setIsFinancialModalOpen: (val: boolean) => void;
    chartData: any[];
    longTermMetrics: any;
    params: SolarParamsState;
    investment: number;
    projectBaseInfo?: any;
    handleUpdate: (updates: Partial<SolarParamsState>) => void;
}

export const SolarCharts: React.FC<SolarChartsProps> = ({
    isChartExpanded, setIsChartExpanded,
    isFinancialModalOpen, setIsFinancialModalOpen,
    chartData, longTermMetrics,
    params, investment, projectBaseInfo, handleUpdate
}) => {
    const isEmc = params.simpleParams.investmentMode === 'emc';

    return (
        <>
            {/* Expanded Chart Modal: Monthly Generation */}
            {isChartExpanded && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6"
                    onClick={() => setIsChartExpanded(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-5xl h-[600px] shadow-2xl p-8 flex flex-col relative animate-[zoomIn_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <span className="p-2 bg-blue-100 text-blue-600 rounded-lg"><span className="material-icons">bar_chart</span></span>
                                    月度发电与用电对比
                                </h2>
                                <p className="text-slate-500 mt-1 ml-12">光伏首年预估发电量 vs 园区历史/预估月度总用电量 (万kWh)</p>
                            </div>
                            <button
                                onClick={() => setIsChartExpanded(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                            >
                                <span className="material-icons text-2xl">close</span>
                            </button>
                        </div>

                        <div className="flex-1 w-full min-h-0 bg-slate-50 rounded-xl border border-slate-100 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 14, fill: '#64748b', fontWeight: 500 }}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        label={{ value: '发电量 (万kWh)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 12 } }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                            padding: '12px 16px'
                                        }}
                                        formatter={(value: number, name: string) => [`${value.toFixed(2)} 万度`, name]}
                                        labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '14px' }}
                                        itemStyle={{ fontWeight: 600, fontSize: '14px' }}
                                    />
                                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }} />
                                    <Bar
                                        dataKey="retrofit"
                                        name="光伏发电量"
                                        fill="url(#colorPv)"
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={1000}
                                    />
                                    <Bar
                                        dataKey="consumption"
                                        name="现状用电量"
                                        fill="#e2e8f0"
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={1000}
                                    />
                                    <defs>
                                        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Modal */}
            {isFinancialModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6"
                    onClick={() => setIsFinancialModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] shadow-2xl overflow-hidden flex flex-col animate-[zoomIn_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-slate-50/50 text-slate-800">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shadow-sm">
                                        <span className="material-icons">monetization_on</span>
                                    </span>
                                    全生命周期测算 (25年财务模型)
                                </h2>
                                <p className="text-slate-500 mt-1 ml-14">
                                    模式: <span className="font-bold text-primary">{params.simpleParams.investmentMode.toUpperCase()}</span> |
                                    精度: <span className="text-blue-600 font-mono">0.01</span> (万)
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsFinancialModalOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-500"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">项目总投资</p>
                                    <div className="text-2xl font-bold text-slate-900">¥ {investment.toFixed(2)} <span className="text-sm font-normal text-slate-500">万</span></div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        {isEmc ? '投资方 25年净收益' : '25年累计净收益'}
                                    </p>
                                    <div className="text-2xl font-bold text-emerald-600">¥ {longTermMetrics.rev25Year.toFixed(2)} <span className="text-sm font-normal text-slate-500">万</span></div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> 业主 25年收益
                                    </p>
                                    <div className="text-2xl font-bold text-blue-600">¥ {(isEmc ? longTermMetrics.totalOwnerBenefit25 : longTermMetrics.rev25Year).toFixed(2)} <span className="text-sm font-normal text-slate-500">万</span></div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">内部收益率 (IRR)</p>
                                    <div className="text-2xl font-bold text-purple-600">{(longTermMetrics.irr || 0).toFixed(2)}%</div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">静态回收期</p>
                                    <div className="text-2xl font-bold text-orange-500">{(longTermMetrics.paybackPeriod || 0).toFixed(2)} <span className="text-sm font-normal text-slate-500">年</span></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                {/* Cash Flow Trend */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <span className="material-icons text-primary text-base">savings</span> 25年累计现金流趋势
                                    </h3>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={longTermMetrics.cashFlows.map((v: number, i: number) => {
                                                const cumulative = longTermMetrics.cashFlows.slice(0, i + 1).reduce((a: number, b: number) => a + b, 0);
                                                return { year: i, value: parseFloat(cumulative.toFixed(2)) };
                                            })} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Yearly Generation Decay */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <span className="material-icons text-orange-500 text-base">wb_sunny</span> 年度发电量预测 (考虑衰减)
                                    </h3>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={longTermMetrics.yearlyDetails} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                                    formatter={(value: number) => [`${value} 万kWh`, '年度发电']}
                                                    labelFormatter={(label) => `第 ${label} 年`}
                                                />
                                                <Line type="monotone" dataKey="generation" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Table */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                    <h3 className="text-sm font-bold text-slate-700">
                                        {isEmc ? '业主 vs 投资方 逐年收益明细 (25年)' : '测算数据明细 (25年)'}
                                    </h3>
                                    <span className="text-[10px] text-slate-400">单位: 万元 (除发电量外) | 精度: 0.01</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="px-5 py-4 sticky left-0 bg-slate-50 min-w-[100px]">运营年份</th>
                                                <th className="px-5 py-4 min-w-[120px]">发电量(万度)</th>
                                                <th className="px-5 py-4 text-right min-w-[140px]">
                                                    {isEmc ? '投资方营收' : '总营收'}
                                                </th>
                                                {isEmc && <th className="px-5 py-4 text-right text-blue-600 min-w-[120px]">业主收益</th>}
                                                <th className="px-5 py-4 text-right min-w-[100px]">
                                                    运维费 <br />
                                                    <span className="text-[10px] font-normal text-slate-400">({params.advParams.omCost}元/W/年)</span>
                                                </th>
                                                <th className="px-5 py-4 text-right min-w-[100px]">
                                                    保险费 <br />
                                                    <span className="text-[10px] font-normal text-slate-400">({projectBaseInfo?.insuranceRate ?? 0.35}%)</span>
                                                </th>
                                                <th className="px-5 py-4 text-right min-w-[140px] group relative cursor-help border-l border-slate-200">
                                                    增值税及附加
                                                    <span className="material-icons absolute top-3 right-1 text-slate-400 text-xs text-opacity-70 group-hover:text-primary transition-colors">info</span>
                                                    <div className="absolute top-12 right-0 w-56 bg-slate-800 text-white text-[10px] p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-50 text-left pointer-events-none break-normal whitespace-pre-line font-normal">
                                                        <span className="font-bold text-blue-300 block mb-1">抵扣结转说明：</span>
                                                        首年全投资产生的进项税先全额留抵。<br />后每年 <b>销项税-进项税-上期留抵</b>，<br />不足扣的填0。<br />仅在大于0时缴纳{projectBaseInfo?.vatExtraRate ?? 6.0}%的城市维护及教育附加税。
                                                    </div>
                                                </th>
                                                <th className="px-5 py-4 text-right min-w-[140px] group relative cursor-help">
                                                    所得税费
                                                    <span className="material-icons absolute top-3 right-1 text-slate-400 text-xs text-opacity-70 group-hover:text-primary transition-colors">info</span>
                                                    <div className="absolute top-12 right-0 w-64 bg-slate-800 text-white text-[10px] p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-50 text-left pointer-events-none break-normal whitespace-pre-line font-normal">
                                                        <span className="font-bold text-orange-300 block mb-1">折旧/利润抵扣说明 (DDB)：</span>
                                                        采用10年双倍余额递减法折旧(20%基础递减)。<br />
                                                        应缴所得利润 = 不含税收入 - 不含税各项成本(运维/保险/质保) - 本年度折旧。
                                                        最终税率 {projectBaseInfo?.taxRate ?? 5.0}%.
                                                    </div>
                                                </th>
                                                <th className="px-5 py-4 text-right bg-slate-50/50 font-bold text-slate-700 min-w-[140px] border-l border-slate-200">
                                                    {isEmc ? '投资方净现金流' : '总净现金流'}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            <tr className="hover:bg-slate-50 bg-slate-50/30">
                                                <td className="px-5 py-3 font-bold text-slate-700 sticky left-0 bg-slate-50/30">第 0 年 (投资)</td>
                                                <td className="px-5 py-3 text-slate-400">-</td>
                                                <td className="px-5 py-3 text-right text-slate-400">-</td>
                                                {isEmc && <td className="px-5 py-3 text-right text-slate-400">-</td>}
                                                <td className="px-5 py-3 text-right text-slate-400">-</td>
                                                <td className="px-5 py-3 text-right text-slate-400">-</td>
                                                <td className="px-5 py-3 text-right text-slate-400 border-l border-slate-100">-</td>
                                                <td className="px-5 py-3 text-right text-slate-400">-</td>
                                                <td className="px-5 py-3 text-right font-bold text-red-500 border-l border-slate-100">
                                                    -{investment.toFixed(2)}
                                                </td>
                                            </tr>
                                            {longTermMetrics.yearlyDetails.map((row: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-3 font-medium text-slate-700 sticky left-0 bg-white">第 {row.year} 年</td>
                                                    <td className="px-5 py-3 text-slate-600 font-mono">{row.generation.toFixed(2)}</td>
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
                </div>
            )}
        </>
    );
};
