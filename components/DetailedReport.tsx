import React, { useRef, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { calculateIRR, generateStandardCashFlows, calculatePaybackPeriod } from '../utils/financial';
import {
    ComposedChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function DetailedReport({ onClose }: { onClose: () => void }) {
    const { projectBaseInfo, modules } = useProject();
    const printRef = useRef<HTMLDivElement>(null);
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [printFormat, setPrintFormat] = useState<'a4-portrait' | 'a4-landscape' | 'image'>('a4-portrait');

    const handlePrint = (format: 'a4-portrait' | 'a4-landscape' | 'image') => {
        setPrintFormat(format);
        setShowPrintDialog(false);

        // 添加打印样式类
        document.body.classList.add('printing');
        document.body.classList.add(`print-${format}`);

        // 打印后清理
        const afterPrint = () => {
            document.body.classList.remove('printing', 'print-a4-portrait', 'print-a4-landscape', 'print-image');
            window.removeEventListener('afterprint', afterPrint);
        };

        window.addEventListener('afterprint', afterPrint);
        setTimeout(() => window.print(), 100);
    };

    // --- Phase 10: 统一财务逻辑 ---
    const activeModules = (Object.values(modules) as any[]).filter(m => m.isActive);
    const totalInvestment = activeModules.reduce((sum, m) => sum + (Number(m.investment) || 0), 0);
    const totalSaving = activeModules.reduce((sum, m) => sum + (Number(m.yearlySaving) || 0), 0);
    const taxRate = projectBaseInfo.taxRate ?? 25.0;
    const spvConfig = projectBaseInfo.spvConfig || { debtRatio: 70, loanInterest: 4.5, loanTerm: 10, shareholderARate: 51 };

    // 生成标淮现金流
    const stdCashFlows = generateStandardCashFlows({
        totalInvestment,
        totalGrossSaving: totalSaving,
        omRate: 0,
        taxRate: taxRate,
        period: 25
    });

    const projectIRR = calculateIRR(stdCashFlows);
    const payback = calculatePaybackPeriod(stdCashFlows);

    const loanAmount = totalInvestment * (spvConfig.debtRatio / 100);
    const equityAmount = totalInvestment - loanAmount;
    const principalPerYear = spvConfig.loanTerm > 0 ? loanAmount / spvConfig.loanTerm : 0;

    // 映射回报告所需格式
    let cumulative = -totalInvestment;
    let leveredCumulative = -equityAmount;

    const cashFlowData = stdCashFlows.map((cf, i) => {
        if (i === 0) return {
            year: 0, revenue: 0, opex: 0, depreciation: 0, interest: 0, principal: 0, ebit: 0, tax: 0,
            net: -totalInvestment, leveredNet: -equityAmount, cumulative: -totalInvestment, leveredCumulative: -equityAmount
        };

        const interest = i <= spvConfig.loanTerm ? (loanAmount - principalPerYear * (i - 1)) * (spvConfig.loanInterest / 100) : 0;
        const principal = i <= spvConfig.loanTerm ? principalPerYear : 0;
        const leveredNet = cf - Math.max(0, interest) - principal;

        cumulative += cf;
        leveredCumulative += leveredNet;

        return {
            year: i,
            revenue: totalSaving * Math.pow(0.9955, i - 1),
            opex: 0,
            depreciation: i <= 20 ? totalInvestment / 20 : 0,
            interest: Math.max(0, interest),
            principal,
            ebit: cf / (1 - (taxRate / 100)),
            tax: (cf / (1 - (taxRate / 100))) * (taxRate / 100),
            net: cf,
            leveredNet: leveredNet,
            cumulative,
            leveredCumulative
        };
    });

    const leveredIRR = calculateIRR(cashFlowData.map(d => d.leveredNet));

    // Module indicators calculation (consistent with global)
    const calculateModuleMetrics = (investment: number, yearlySaving: number) => {
        const mcf = generateStandardCashFlows({
            totalInvestment: investment,
            totalGrossSaving: yearlySaving,
            omRate: 0,
            taxRate: taxRate,
            period: 25
        });
        const mIrr = calculateIRR(mcf);
        const mPayback = calculatePaybackPeriod(mcf);
        return { irr: mIrr, payback: mPayback, npv: 0 };
    };

    const chartData = cashFlowData.slice(1, 16);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col">
            <div className="h-16 bg-slate-800 flex items-center justify-between px-6 shrink-0 print:hidden text-white shadow-md">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">完整版深度报告 (Detailed Report)</h2>
                        <span className="text-[10px] text-slate-400">支持 25 年期现金流表与 BOM 投资拆解</span>
                    </div>
                </div>
                <button
                    onClick={() => setShowPrintDialog(true)}
                    className="bg-primary hover:bg-primary-hover px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/30"
                >
                    <span className="material-symbols-outlined text-sm">print</span>
                    <span className="text-sm">导出报告</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 print:p-0 print:m-0 flex justify-center print:overflow-visible bg-slate-200 print:bg-white custom-scrollbar print:block print:h-auto">
                <div
                    ref={printRef}
                    className="bg-white shadow-2xl print:shadow-none mx-auto print:mx-0 print:w-full relative print:auto"
                    style={{
                        width: '210mm',
                    }}
                >
                    <div className="p-[15mm] print:p-[10mm]">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b-4 border-primary pb-6 mb-8 page-break-inside-avoid print:border-b-2">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg print:bg-primary print:border print:border-slate-300">
                                        <span className="text-white text-2xl font-bold">ZC</span>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-white print:text-slate-900 leading-tight">零碳项目深度评估报告</h1>
                                        <div className="text-white/80 font-medium">Internal Feasibility & Financial Assessment</div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-white/70">
                                    <div className="text-lg font-bold italic">{projectBaseInfo.name || '零碳项目'}</div>
                                    <div className="text-xs font-medium uppercase tracking-wider">
                                        {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })} 发行
                                    </div>
                                    <div className="text-xs font-medium">
                                        商业版本 v1.0
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Executive Summary Cards */}
                        <div className="grid grid-cols-4 gap-5 mb-12">
                            <div className="bg-white rounded-xl border-2 border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">项目总投资</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-slate-900">¥{totalInvestment.toFixed(2)}</span>
                                    <span className="text-sm font-medium text-slate-500">万</span>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border-2 border-emerald-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-emerald-600 text-xl">trending_up</span>
                                    <span className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider">标准周期 IRR (25年)</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-emerald-600">{projectIRR.toFixed(2)}%</span>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border-2 border-blue-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-blue-600 text-xl">schedule</span>
                                    <span className="text-xs font-bold text-blue-600/70 uppercase tracking-wider">静态投资回收期</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-blue-600">{payback.toFixed(2)}</span>
                                    <span className="text-sm font-medium text-slate-500">年</span>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border-2 border-purple-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-purple-600 text-xl">analytics</span>
                                    <span className="text-xs font-bold text-purple-600/70 uppercase tracking-wider">杠杆 IRR (Levered)</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-purple-600">{leveredIRR.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Financial Analysis Grid */}
                        <div className="grid grid-cols-2 gap-8 mb-12">
                            <div className="page-break-inside-avoid">
                                <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-primary rounded-full"></span>
                                    <span className="uppercase tracking-wide">年度预测现金流</span>
                                    <span className="ml-auto text-xs font-medium text-slate-400">前15年</span>
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="net" name="年度净流量" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Line type="monotone" dataKey="cumulative" name="累计现金流" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="page-break-inside-avoid">
                                <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-primary rounded-full"></span>
                                    <span className="uppercase tracking-wide">投资结构与资金运用</span>
                                </h3>
                                <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-5">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-lg">account_balance_wallet</span>
                                                <span className="text-sm font-medium text-slate-700">自有资金</span>
                                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{100 - spvConfig.debtRatio}%</span>
                                            </div>
                                            <span className="font-bold text-slate-900">¥{equityAmount.toFixed(2)} 万</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-blue-600 text-lg">credit_card</span>
                                                <span className="text-sm font-medium text-slate-700">债务融资</span>
                                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{spvConfig.debtRatio}%</span>
                                            </div>
                                            <span className="font-bold text-blue-700">¥{loanAmount.toFixed(2)} 万</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <div className="p-3 bg-white rounded-xl border border-slate-100 text-center">
                                                <div className="text-xs text-slate-400 font-medium mb-1">贷款利率</div>
                                                <div className="text-xl font-bold text-slate-800">{spvConfig.loanInterest}%</div>
                                            </div>
                                            <div className="p-3 bg-white rounded-xl border border-slate-100 text-center">
                                                <div className="text-xs text-slate-400 font-medium mb-1">还款年限</div>
                                                <div className="text-xl font-bold text-slate-800">{spvConfig.loanTerm}年</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modules Breakdown */}
                        <div className="pt-8 page-break-before-always">
                            <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="w-1 h-5 bg-primary rounded-full"></span>
                                <span className="uppercase tracking-wide">各子系统资产包详细分析</span>
                            </h3>
                            <div className="space-y-8">
                                {activeModules.map((m, i) => {
                                    let details: { label: string, value: string }[] = [];
                                    if (m.id === 'retrofit-solar') {
                                        details = [
                                            { label: '系统寿命', value: '25 年' },
                                            { label: '首年利用小时', value: `${m.params?.utilizationHours || 0} h` },
                                            { label: '组件类型', value: m.params?.moduleType || 'N/A' },
                                        ];
                                    } else if (m.id === 'retrofit-charging') {
                                        details = [
                                            { label: '桩体数量', value: `${m.params?.pileCount || 0} 个` },
                                            { label: '日均满载利用率', value: `${m.params?.utilizationRate || 0} %` },
                                            { label: '充电服务费', value: `${m.params?.serviceFee || 0} 元/度` },
                                        ];
                                    } else {
                                        details = [
                                            { label: '核心指征', value: m.kpiPrimary?.value || 'N/A' }
                                        ];
                                    }

                                    const metrics = calculateModuleMetrics(Number(m.investment) || 0, Number(m.yearlySaving) || 0);

                                    return (
                                        <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden page-break-inside-avoid shadow-sm mb-6 print:mb-8">
                                            <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                                                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">extension</span>
                                                    {m.name}
                                                </h4>
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                                    {m.kpiSecondary?.label}: {m.kpiSecondary?.value || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">payments</span>
                                                        板块级财务模型
                                                    </h5>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-end pb-2 border-b border-slate-100">
                                                            <span className="text-sm text-slate-600">专项投资额 (CAPEX)</span>
                                                            <span className="text-base font-bold text-slate-900">¥{(Number(m.investment) || 0).toFixed(2)} <span className="text-xs font-normal text-slate-500">万</span></span>
                                                        </div>
                                                        <div className="flex justify-between items-end pb-2 border-b border-slate-100">
                                                            <span className="text-sm text-slate-600">预期首年净收益</span>
                                                            <span className="text-base font-bold text-emerald-600">¥{(Number(m.yearlySaving) || 0).toFixed(2)} <span className="text-xs font-normal text-emerald-600/70">万</span></span>
                                                        </div>
                                                        <div className="flex justify-between items-end pb-2 border-b border-slate-100">
                                                            <span className="text-sm text-slate-600">单体静态回收期</span>
                                                            <span className="text-base font-bold text-blue-600">{metrics.payback.toFixed(2)} <span className="text-xs font-normal text-blue-600/70">年</span></span>
                                                        </div>
                                                        <div className="flex justify-between items-end pt-1">
                                                            <span className="text-sm text-slate-600">单模块 IRR</span>
                                                            <span className="text-base font-bold text-purple-600">{metrics.irr.toFixed(2)}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">settings_suggest</span>
                                                        核心设备/工程参数
                                                    </h5>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 col-span-2 sm:col-span-1">
                                                            <div className="text-[10px] text-primary/70 font-bold uppercase mb-1">{m.kpiPrimary?.label}</div>
                                                            <div className="text-base font-black text-primary">{m.kpiPrimary?.value}</div>
                                                        </div>
                                                        {details.map((d, idx) => (
                                                            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                                                                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">{d.label}</div>
                                                                <div className="text-sm font-bold text-slate-800">{d.value}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                                <p className="text-sm text-slate-600 font-medium">本报告由 ZeroCarbon Pro 评估软件自动生成</p>
                                <p className="text-xs text-slate-400 mt-2">数据仅供参考，不作为最终投资承诺及法律依据。</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Format Dialog */}
                {showPrintDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] print:hidden" onClick={() => setShowPrintDialog(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary text-2xl">print</span>
                                <h2 className="text-xl font-bold text-slate-900">选择导出格式</h2>
                            </div>
                            <div className="space-y-3">
                                <button
                                    onClick={() => handlePrint('a4-portrait')}
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-primary">portrait</span>
                                        <div className="text-left flex-1">
                                            <div className="font-bold text-slate-900 mb-1">A4 纵向打印</div>
                                            <div className="text-sm text-slate-500">标准 A4 纸张，适合文档打印和正式汇报</div>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handlePrint('a4-landscape')}
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-primary">crop_landscape</span>
                                        <div className="text-left flex-1">
                                            <div className="font-bold text-slate-900 mb-1">A4 横向打印</div>
                                            <div className="text-sm text-slate-500">横向布局，图表显示更完整</div>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handlePrint('image')}
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-primary">image</span>
                                        <div className="text-left flex-1">
                                            <div className="font-bold text-slate-900 mb-1">导出为图片</div>
                                            <div className="text-sm text-slate-500">适合社交媒体分享和快速预览</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                            <button
                                onClick={() => setShowPrintDialog(false)}
                                className="w-full mt-6 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-700 transition-colors"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
