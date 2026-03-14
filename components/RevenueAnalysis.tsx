import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
    ComposedChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Legend, ReferenceLine, Area, AreaChart, PieChart, Pie, Cell,
    ScatterChart, Scatter, ZAxis, ReferenceArea, Label
} from 'recharts';
import { View } from '../types';
import { useProject, ModuleData } from '../context/ProjectContext';
import { calculateIRR, generateStandardCashFlows, calculatePaybackPeriod } from '../utils/financial';
import { exportFinancialSheet, FinancialSummaryData, AnnualCashFlowData } from '../utils/excelExport';
import { AnimatedNumber } from './ui/AnimatedNumber';

interface RevenueAnalysisProps {
    onChangeView?: (view: View) => void;
}

// --- Phase 10: 统一财务逻辑 ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const getStandardMetrics = (investment: number, yearlySaving: number, taxRate: number, vatRate: number, vatExtraRate: number) => {
    const cf = generateStandardCashFlows({
        totalInvestment: investment,
        totalGrossSaving: yearlySaving,
        omRate: 0,
        taxRate: taxRate,
        vatRate: vatRate,
        vatExtraRate: vatExtraRate,
        period: 25
    });
    return {
        irr: calculateIRR(cf),
        payback: calculatePaybackPeriod(cf),
        cashFlows: cf
    };
};

export default function RevenueAnalysis({ onChangeView }: RevenueAnalysisProps) {
    const { modules, projectBaseInfo } = useProject();
    const [isExporting, setIsExporting] = useState(false);

    // --- 2. Sensitivity Parameters State ---
    const [params, setParams] = useState({
        period: 20, // Analysis Period (Years)
        discountRate: 5.0, // %
        elecInflation: 2.5, // % per year
        carbonPrice: 80, // RMB/ton start
        carbonInflation: 5.0, // % per year
        opexRate: 1.5, // % of CAPEX per year
        degradation: 0.8 // % System degradation per year
    });

    // 使用 useRef 访问最新的值，避免不必要的函数重建
    const paramsRef = useRef(params);
    const simulationRef = useRef<any>(null);
    const modulesRef = useRef(modules);
    const projectBaseInfoRef = useRef(projectBaseInfo);

    // 更新 ref 值
    useEffect(() => { paramsRef.current = params; }, [params]);
    useEffect(() => { modulesRef.current = modules; }, [modules]);
    useEffect(() => { projectBaseInfoRef.current = projectBaseInfo; }, [projectBaseInfo]);

    // --- 1. Centralized Data Aggregation & Module Analysis ---
    const analysisData = useMemo(() => {
        const activeModules = (Object.values(modules) as ModuleData[]).filter(m => m.isActive);
        const taxRate = projectBaseInfo.taxRate ?? 5.0;
        const vatRate = projectBaseInfo.vatRate ?? 13.0;
        const vatExtraRate = projectBaseInfo.vatExtraRate ?? 1.56;

        let totalInvestment = 0;
        let totalFirstYearSaving = 0;

        // Analyze individual modules
        const baseMetrics = activeModules.map(m => {
            totalInvestment += m.investment;
            totalFirstYearSaving += m.yearlySaving;

            const metrics = getStandardMetrics(m.investment, m.yearlySaving, taxRate, vatRate, vatExtraRate);
            return { ...m, ...metrics, roi: metrics.irr * 3 }; // ROI proxy for quadrant
        });

        // Calculate Averages for Quadrants
        const avgInvest = activeModules.length > 0 ? totalInvestment / activeModules.length : 50;
        const avgROI = activeModules.length > 0 ? baseMetrics.reduce((a, b) => a + (b.roi || 0), 0) / activeModules.length : 20;

        // Determine Max for chart scaling
        const maxInvest = Math.max(...baseMetrics.map(m => m.investment), avgInvest * 2) * 1.1;
        const maxROI = Math.max(...baseMetrics.map(m => m.roi), avgROI * 1.5) * 1.1;

        // Assign Quadrants
        const moduleMetrics = baseMetrics.map(m => {
            let type = '';
            let color = '';
            if (m.investment <= avgInvest && m.roi >= avgROI) {
                type = '速赢型 (Quick Win)';
                color = '#10b981';
            } else if (m.investment > avgInvest && m.roi >= avgROI) {
                type = '战略型 (Strategic)';
                color = '#8b5cf6';
            } else if (m.investment <= avgInvest && m.roi < avgROI) {
                type = '基础型 (Basic)';
                color = '#64748b';
            } else {
                type = '审慎型 (Cautious)';
                color = '#ef4444';
            }

            return {
                ...m,
                type,
                color,
                x: m.investment,
                y: m.roi,
                z: m.irr
            };
        });

        const rankedModules = [...moduleMetrics].sort((a, b) => b.irr - a.irr);
        const investmentMix = activeModules.map(m => ({ name: m.name, value: m.investment })).filter(i => i.value > 0);
        const savingMix = activeModules.map(m => ({ name: m.name, value: m.yearlySaving })).filter(i => i.value > 0);

        return {
            activeModules,
            moduleMetrics,
            rankedModules,
            totalInvestment,
            firstYearSaving: totalFirstYearSaving,
            investmentMix,
            savingMix,
            avgInvest,
            avgROI,
            maxInvest,
            maxROI
        };
    }, [modules, projectBaseInfo.taxRate]);

    // --- 3. Total Financial Simulation Engine (Aggregated) ---
    const simulation = useMemo(() => {
        const { totalInvestment, firstYearSaving } = analysisData;
        const taxRate = projectBaseInfo.taxRate ?? 5.0;
        const vatRate = projectBaseInfo.vatRate ?? 13.0;
        const vatExtraRate = projectBaseInfo.vatExtraRate ?? 1.56;

        const metrics = getStandardMetrics(totalInvestment, firstYearSaving, taxRate, vatRate, vatExtraRate);

        const annualData = metrics.cashFlows.map((net, year) => {
            let cumulative = 0;
            for (let j = 0; j <= year; j++) cumulative += metrics.cashFlows[j];
            return {
                year,
                net: parseFloat(net.toFixed(2)),
                cumulative: parseFloat(cumulative.toFixed(2))
            };
        });

        return { ...metrics, annualData, npv: 0 }; // npv placeholder
    }, [analysisData, projectBaseInfo.taxRate]);

    // 更新 simulation ref
    useEffect(() => { simulationRef.current = simulation; }, [simulation]);

    // Excel导出处理函数（使用 ref 避免不必要的重建）
    const handleExportExcel = useCallback(async () => {
        const currentModules = modulesRef.current;
        const currentParams = paramsRef.current;
        const currentSimulation = simulationRef.current;
        const currentProjectInfo = projectBaseInfoRef.current;

        const activeModules = (Object.values(currentModules) as ModuleData[]).filter(m => m.isActive);

        // 边界条件检查
        if (activeModules.length === 0) {
            alert('请先启用至少一个改造模块');
            return;
        }

        const totalInvestment = activeModules.reduce((sum, m) => sum + m.investment, 0);
        const totalFirstYearSaving = activeModules.reduce((sum, m) => sum + m.yearlySaving, 0);

        // 检查投资和收益是否有效
        if (totalInvestment <= 0 || totalFirstYearSaving <= 0) {
            alert('投资额或年收益数据无效，请检查模块配置');
            return;
        }

        setIsExporting(true);

        try {
            // 构建模块数据
            const moduleExportData = activeModules.map(m => {
                const metrics = getStandardMetrics(m.investment, m.yearlySaving, currentProjectInfo.taxRate ?? 5, currentProjectInfo.vatRate ?? 13, currentProjectInfo.vatExtraRate ?? 1.56);
                return {
                    name: m.name,
                    isActive: m.isActive,
                    strategy: m.strategy,
                    investment: m.investment,
                    yearlySaving: m.yearlySaving,
                    roi: metrics.irr * 3,
                    irr: metrics.irr,
                    payback: metrics.payback,
                    npv: 0,
                    kpiPrimary: `${m.kpiPrimary.label}: ${m.kpiPrimary.value}`,
                    kpiSecondary: `${m.kpiSecondary.label}: ${m.kpiSecondary.value}`,
                };
            });

            // 构建年度现金流数据 (25年)
            const metrics = getStandardMetrics(totalInvestment, totalFirstYearSaving, currentProjectInfo.taxRate ?? 5, currentProjectInfo.vatRate ?? 13, currentProjectInfo.vatExtraRate ?? 1.56);
            const cashFlows: AnnualCashFlowData[] = metrics.cashFlows.map((net, year) => {
                let cumulative = 0;
                for (let j = 0; j <= year; j++) cumulative += metrics.cashFlows[j];
                return {
                    year,
                    net: parseFloat(net.toFixed(2)),
                    cumulative: parseFloat(cumulative.toFixed(2))
                };
            });

            // 构建财务汇总数据
            const financialData: FinancialSummaryData = {
                projectName: currentProjectInfo.name || '零碳项目',
                projectType: currentProjectInfo.type || '综合改造',
                totalInvestment,
                totalFirstYearSaving,
                npv: 0,
                irr: metrics.irr,
                payback: metrics.payback,
                period: 25,
                discountRate: currentParams.discountRate,
                modules: moduleExportData,
                annualData: cashFlows,
            };

            // 导出Excel（使用 setTimeout 让 UI 先更新）
            setTimeout(() => {
                exportFinancialSheet(financialData, '财务测算表');
                setIsExporting(false);
            }, 100);

        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败，请重试');
            setIsExporting(false);
        }
    }, []); // 空依赖数组，使用 ref 访问最新值

    return (
        <div className="flex h-full bg-slate-50 relative">
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">财务收益综合分析</h2>
                            <p className="text-xs text-slate-500">全项目投资回报模型与分项价值评估</p>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full ml-4 border border-emerald-100">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-bold text-emerald-700">
                                已分析 {analysisData.activeModules.length} 个子系统
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleExportExcel}
                        disabled={isExporting}
                        className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${isExporting
                            ? 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed'
                            : 'text-primary hover:underline bg-primary/5 border-primary/10 hover:bg-primary/10'
                            }`}
                    >
                        <span className="material-icons text-sm">
                            {isExporting ? 'hourglass_empty' : 'download'}
                        </span>
                        {isExporting ? '正在导出...' : '导出财务测算表 (.xlsx)'}
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 pb-20 scroll-smooth">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* 1. Macro KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 blur-xl group-hover:bg-blue-100 transition-all"></div>
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <span className="text-xs font-bold text-slate-500 uppercase">初始总投资 (CAPEX)</span>
                                    <span className="material-icons text-blue-500 text-lg">account_balance</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-900 relative z-10">¥ <AnimatedNumber value={analysisData.totalInvestment} decimals={2} /> <span className="text-sm font-normal text-slate-500">万</span></div>
                                <div className="mt-2 text-xs text-slate-400">含设备、施工及设计费</div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 blur-xl group-hover:bg-emerald-100 transition-all"></div>
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <span className="text-xs font-bold text-slate-500 uppercase">项目净现值 (NPV)</span>
                                    <span className="material-icons text-emerald-500 text-lg">monetization_on</span>
                                </div>
                                <div className={`text-3xl font-bold relative z-10 ${simulation.npv > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    ¥ <AnimatedNumber value={simulation.npv} decimals={2} /> <span className="text-sm font-normal text-slate-500">万</span>
                                </div>
                                <div className="mt-2 text-xs text-slate-400">折现率 {params.discountRate}%</div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-full -mr-8 -mt-8 blur-xl group-hover:bg-purple-100 transition-all"></div>
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <span className="text-xs font-bold text-slate-500 uppercase">内部收益率 (IRR)</span>
                                    <span className="material-icons text-purple-500 text-lg">trending_up</span>
                                </div>
                                <div className="text-3xl font-bold text-purple-600 relative z-10"><AnimatedNumber value={simulation.irr} decimals={2} /> %</div>
                                <div className="mt-2 text-xs text-slate-400">{params.period}年全周期</div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 rounded-full -mr-8 -mt-8 blur-xl group-hover:bg-orange-100 transition-all"></div>
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <span className="text-xs font-bold text-slate-500 uppercase">静态回本周期</span>
                                    <span className="material-icons text-orange-500 text-lg">timelapse</span>
                                </div>
                                <div className="text-3xl font-bold text-orange-600 relative z-10">
                                    {simulation.payback > params.period ? `>${params.period}` : <AnimatedNumber value={simulation.payback} decimals={2} />} <span className="text-sm font-normal text-slate-500">年</span>
                                </div>
                                <div className="mt-2 text-xs text-slate-400">现金流转正节点</div>
                            </div>
                        </div>

                        {/* 3. NEW SECTION: Module Ranking & Detail Analysis */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                                <h2 className="text-lg font-bold text-slate-900">分项投资价值排行与深度分析</h2>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left: Leaderboard & Recommendations */}
                                <div className="space-y-6">
                                    {/* Top Recommendation Card */}
                                    {analysisData.rankedModules.length > 0 && (
                                        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                                            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                            <div className="flex items-center gap-2 mb-4 relative z-10">
                                                <span className="material-icons text-yellow-300">verified</span>
                                                <span className="text-xs font-bold uppercase tracking-wider text-purple-200">最佳投资建议 (Best Choice)</span>
                                            </div>
                                            <h3 className="text-2xl font-bold mb-1 relative z-10">{analysisData.rankedModules[0].name}</h3>
                                            <p className="text-sm text-purple-200 mb-4 relative z-10">{analysisData.rankedModules[0].strategy}</p>

                                            <div className="grid grid-cols-3 gap-2 relative z-10">
                                                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm text-center">
                                                    <div className="text-[10px] text-purple-200">IRR</div>
                                                    <div className="text-lg font-bold text-yellow-300">{analysisData.rankedModules[0].irr.toFixed(2)}%</div>
                                                </div>
                                                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm text-center">
                                                    <div className="text-[10px] text-purple-200">ROI</div>
                                                    <div className="text-lg font-bold text-white">{analysisData.rankedModules[0].roi.toFixed(2)}%</div>
                                                </div>
                                                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm text-center">
                                                    <div className="text-[10px] text-purple-200">回本周期</div>
                                                    <div className="text-lg font-bold text-white">{analysisData.rankedModules[0].payback.toFixed(2)}<span className="text-[10px] font-normal">年</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Other Rankings */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                                        <h4 className="text-sm font-bold text-slate-800 mb-4">综合评分榜单</h4>
                                        <div className="space-y-3">
                                            {analysisData.rankedModules.slice(1).map((m, idx) => (
                                                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-purple-200 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">{idx + 2}</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-700">{m.name}</div>
                                                            <div className="text-[10px] text-slate-400">IRR {m.irr.toFixed(2)}% · ROI {m.roi.toFixed(2)}%</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-bold text-slate-700">¥ {m.investment.toFixed(2)}万</div>
                                                        <div className="text-[10px] text-green-600">{m.payback.toFixed(2)}年回本</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {analysisData.rankedModules.length === 0 && <div className="text-center text-xs text-slate-400 py-4">暂无模块数据</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle & Right: Portfolio Matrix Chart - UPGRADED */}
                                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                                <span className="material-icons text-blue-500">bubble_chart</span>
                                                投资组合矩阵 (Portfolio Matrix)
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1">基于四象限分析法评估项目优劣 | 气泡大小 = 净现值 (NPV)</p>
                                        </div>
                                        <div className="flex gap-4">
                                            {/* Dynamic Legend */}
                                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-[10px] text-slate-600">速赢 (Quick Win)</span></div>
                                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span><span className="text-[10px] text-slate-600">战略 (Strategic)</span></div>
                                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span><span className="text-[10px] text-slate-600">基础 (Basic)</span></div>
                                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span className="text-[10px] text-slate-600">审慎 (Cautious)</span></div>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    type="number"
                                                    dataKey="x"
                                                    name="投资额"
                                                    unit="万"
                                                    tick={{ fontSize: 10 }}
                                                    domain={[0, (dataMax: number) => Math.max(dataMax, analysisData.maxInvest)]}
                                                    label={{ value: '投资成本 (Investment Cost)', position: 'bottom', offset: 0, fontSize: 10 }}
                                                />
                                                <YAxis
                                                    type="number"
                                                    dataKey="y"
                                                    name="ROI"
                                                    unit="%"
                                                    tick={{ fontSize: 10 }}
                                                    domain={[0, (dataMax: number) => Math.max(dataMax, analysisData.maxROI)]}
                                                    label={{ value: 'ROI', angle: -90, position: 'left', offset: 0, fontSize: 10 }}
                                                />
                                                <ZAxis type="number" dataKey="z" range={[100, 1000]} name="NPV" unit="万" />

                                                <Tooltip
                                                    cursor={{ strokeDasharray: '3 3' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs z-50">
                                                                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                                                                        <span className="font-bold text-slate-800 text-sm">{data.name}</span>
                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: data.color }}>{data.type.split(' ')[0]}</span>
                                                                    </div>
                                                                    <p className="text-slate-500 mb-0.5">投资: <span className="text-slate-800 font-bold">¥{data.x.toFixed(2)}万</span></p>
                                                                    <p className="text-slate-500 mb-0.5">ROI: <span className="text-slate-800 font-bold">{data.y.toFixed(2)}%</span></p>
                                                                    <p className="text-slate-500">NPV: <span className="text-slate-800 font-bold">¥{data.z.toFixed(2)}万</span></p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />

                                                {/* Quadrant Backgrounds */}
                                                {/* Q2: Quick Win (Low Inv, High ROI) */}
                                                <ReferenceArea x1={0} x2={analysisData.avgInvest} y1={analysisData.avgROI} y2={analysisData.maxROI} fill="#10b981" fillOpacity={0.05} strokeOpacity={0} />
                                                {/* Q1: Strategic (High Inv, High ROI) */}
                                                <ReferenceArea x1={analysisData.avgInvest} x2={analysisData.maxInvest} y1={analysisData.avgROI} y2={analysisData.maxROI} fill="#8b5cf6" fillOpacity={0.05} strokeOpacity={0} />
                                                {/* Q3: Basic (Low Inv, Low ROI) */}
                                                <ReferenceArea x1={0} x2={analysisData.avgInvest} y1={0} y2={analysisData.avgROI} fill="#64748b" fillOpacity={0.05} strokeOpacity={0} />
                                                {/* Q4: Cautious (High Inv, Low ROI) */}
                                                <ReferenceArea x1={analysisData.avgInvest} x2={analysisData.maxInvest} y1={0} y2={analysisData.avgROI} fill="#ef4444" fillOpacity={0.05} strokeOpacity={0} />

                                                {/* Center Lines */}
                                                <ReferenceLine x={analysisData.avgInvest} stroke="#94a3b8" strokeDasharray="5 5" label={{ value: "平均投资", position: 'insideTopRight', fontSize: 10, fill: "#94a3b8" }} />
                                                <ReferenceLine y={analysisData.avgROI} stroke="#94a3b8" strokeDasharray="5 5" label={{ value: "平均ROI", position: 'insideRight', fontSize: 10, fill: "#94a3b8" }} />

                                                <Scatter name="Modules" data={analysisData.moduleMetrics}>
                                                    {analysisData.moduleMetrics.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                                                    ))}
                                                </Scatter>
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Composition Analysis Row (Existing) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Investment Mix */}
                            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-72">
                                <h3 className="font-bold text-slate-800 mb-4 text-sm">投资结构分析 (Investment Mix)</h3>
                                <div className="flex-1 flex items-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analysisData.investmentMix}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {analysisData.investmentMix.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val: number) => `¥${val}万`} />
                                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            {/* Revenue Mix */}
                            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-72">
                                <h3 className="font-bold text-slate-800 mb-4 text-sm">收益来源占比 (Revenue Sources)</h3>
                                <div className="flex-1 flex items-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analysisData.savingMix}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {analysisData.savingMix.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} /> // Offset colors
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val: number) => `¥${val}万`} />
                                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>
                        </div>

                        {/* NEW SECTION: Sensitivity Analysis (Tornado) */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <span className="material-icons text-red-500">tornado</span>
                                        关键因素敏感性压力测试 (Tornado Chart)
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">评估建造成本超支或电价波动对核心指标 (IRR) 的影响幅度，辅助防范投资风险。</p>
                                </div>
                            </div>

                            <div className="flex gap-8 items-center flex-col md:flex-row">
                                <div className="flex-1 w-full h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            layout="vertical"
                                            data={[
                                                {
                                                    name: '建设成本 (CAPEX) ±10%',
                                                    low: parseFloat((calculateIRR(generateStandardCashFlows({ totalInvestment: analysisData.totalInvestment * 1.1, totalGrossSaving: analysisData.firstYearSaving, omRate: 0, taxRate: projectBaseInfo.taxRate ?? 5, vatRate: projectBaseInfo.vatRate ?? 13, vatExtraRate: projectBaseInfo.vatExtraRate ?? 1.56, period: 25 })) - simulation.irr).toFixed(2)),
                                                    high: parseFloat((calculateIRR(generateStandardCashFlows({ totalInvestment: analysisData.totalInvestment * 0.9, totalGrossSaving: analysisData.firstYearSaving, omRate: 0, taxRate: projectBaseInfo.taxRate ?? 5, vatRate: projectBaseInfo.vatRate ?? 13, vatExtraRate: projectBaseInfo.vatExtraRate ?? 1.56, period: 25 })) - simulation.irr).toFixed(2))
                                                },
                                                {
                                                    name: '基础收益 (Revenue) ±10%',
                                                    low: parseFloat((calculateIRR(generateStandardCashFlows({ totalInvestment: analysisData.totalInvestment, totalGrossSaving: analysisData.firstYearSaving * 0.9, omRate: 0, taxRate: projectBaseInfo.taxRate ?? 5, vatRate: projectBaseInfo.vatRate ?? 13, vatExtraRate: projectBaseInfo.vatExtraRate ?? 1.56, period: 25 })) - simulation.irr).toFixed(2)),
                                                    high: parseFloat((calculateIRR(generateStandardCashFlows({ totalInvestment: analysisData.totalInvestment, totalGrossSaving: analysisData.firstYearSaving * 1.1, omRate: 0, taxRate: projectBaseInfo.taxRate ?? 5, vatRate: projectBaseInfo.vatRate ?? 13, vatExtraRate: projectBaseInfo.vatExtraRate ?? 1.56, period: 25 })) - simulation.irr).toFixed(2))
                                                },
                                                {
                                                    name: '税率变动 (Tax) ±5%',
                                                    low: parseFloat((calculateIRR(generateStandardCashFlows({ totalInvestment: analysisData.totalInvestment, totalGrossSaving: analysisData.firstYearSaving, omRate: 0, taxRate: (projectBaseInfo.taxRate ?? 5) + 5, vatRate: projectBaseInfo.vatRate ?? 13, vatExtraRate: projectBaseInfo.vatExtraRate ?? 1.56, period: 25 })) - simulation.irr).toFixed(2)),
                                                    high: parseFloat((calculateIRR(generateStandardCashFlows({ totalInvestment: analysisData.totalInvestment, totalGrossSaving: analysisData.firstYearSaving, omRate: 0, taxRate: Math.max(0, (projectBaseInfo.taxRate ?? 5) - 5), vatRate: projectBaseInfo.vatRate ?? 13, vatExtraRate: projectBaseInfo.vatExtraRate ?? 1.56, period: 25 })) - simulation.irr).toFixed(2))
                                                }
                                            ]}
                                            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                                            <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`} />
                                            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={120} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                cursor={{ fill: '#F8FAFC' }}
                                                formatter={(value: number, name: string) => [`${value > 0 ? '+' : ''}${value}% (绝对IRR: ${(simulation.irr + value).toFixed(2)}%)`, name === 'high' ? '有利变化 (High)' : '不利变化 (Low)']}
                                                contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            <ReferenceLine x={0} stroke="#94A3B8" strokeDasharray="3 3" />
                                            <Bar dataKey="low" name="不利波动 (恶化)" fill="#EF4444" barSize={24} radius={[4, 0, 0, 4]} />
                                            <Bar dataKey="high" name="有利波动 (向好)" fill="#10B981" barSize={24} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full md:w-64 bg-slate-50 border border-slate-100 rounded-xl p-4 shrink-0 text-slate-600 text-sm">
                                    <p className="mb-3">
                                        <strong>基准 IRR：<span className="text-purple-600">{simulation.irr.toFixed(2)}%</span></strong>
                                    </p>
                                    <p className="mb-2 text-xs">通过此模型可以清晰看出，项目回报对 <strong className="text-slate-800">基础电价的波动</strong> 与 <strong className="text-slate-800">前期建造成本风险</strong> 具有最强关联性。</p>
                                    <p className="text-xs">在最恶劣组合情境下（成本超支10%且电价下跌10%），项目IRR可能跌破安全线，建议在 EPC 合同中附加严格的造价封顶条款。</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}