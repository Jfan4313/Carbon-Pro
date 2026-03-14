import React, { useState, useCallback, useMemo, memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid, Brush } from 'recharts';
import { useProject } from '../context/ProjectContext';
import { projectStorageService } from '../services/projectStorage';
import { ProjectFullData } from '../types/projectStorage';
import ProjectManager from './ProjectManager';
import { calculateIRR, generateStandardCashFlows, calculatePaybackPeriod } from '../utils/financial';

import { View } from '../types';

interface DashboardProps {
  onChangeView?: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  const { projectBaseInfo, modules, importProjectConfig, exportProjectConfig, quickSaveProject } = useProject();
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({ base: true, current: true });
  const [showQuickSaveDialog, setShowQuickSaveDialog] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [projectDescriptionInput, setProjectDescriptionInput] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // --- 实时数据聚合逻辑 ---
  const activeModules = useMemo(() =>
    Object.values(modules || {}).filter((m: any) => m.isActive)
    , [modules]);

  const totalInvestment: number = useMemo(() =>
    activeModules.reduce((sum: number, m: any) => sum + (Number(m.investment) || 0), 0)
    , [activeModules]) as number;

  const totalSaving: number = useMemo(() =>
    activeModules.reduce((sum: number, m: any) => sum + (Number(m.yearlySaving) || 0), 0)
    , [activeModules]) as number;

  // 统一 25 年期 IRR 与回本周期测算 (Phase 10)
  const { projectIRR, projectPayback } = useMemo(() => {
    if (totalInvestment <= 0 || totalSaving <= 0) return { projectIRR: 0, projectPayback: 0 };

    // 生成标准现金流
    const cashFlows = generateStandardCashFlows({
      totalInvestment,
      totalGrossSaving: totalSaving,
      omRate: 0,
      taxRate: projectBaseInfo.taxRate ?? 25.0,
      period: 25 // 统一对齐 25 年 
    });

    return {
      projectIRR: calculateIRR(cashFlows),
      projectPayback: calculatePaybackPeriod(cashFlows)
    };
  }, [totalInvestment, totalSaving, projectBaseInfo.taxRate]);

  const payback: number = projectPayback;

  // 动态图表数据：将年化总收益分布到 12 个月 (按典型权重)
  const dynamicChartData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const weights = [3.2, 3.5, 4.1, 4.8, 5.5, 5.2, 5.8, 5.6, 4.9, 4.5, 3.8, 3.3];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const baseEnergyBillAnnual = 1000; // 假设基准年电费 1000 万 (Mock值)

    return months.map((m, i) => {
      const monthlySaving = totalSaving * (weights[i] / totalWeight);
      const monthlyBase = (baseEnergyBillAnnual / 12) * (1 + (weights[i] - 4.5) / 10);
      return {
        name: m,
        base: parseFloat(monthlyBase.toFixed(1)),
        current: parseFloat((monthlyBase - monthlySaving).toFixed(1))
      };
    });
  }, [totalSaving]);

  // --- 结束聚合逻辑 ---

  const handleLegendClick = useCallback((e: any) => {
    const { dataKey } = e;
    setVisibleSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  }, []);

  // 导入项目配置
  const handleImportProject = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await projectStorageService.importProjectConfig(file);

    if (result.valid && result.data) {
      importProjectConfig(result.data);
    } else {
      alert('导入失败：' + result.errors.join('\n'));
      if (result.warnings.length > 0) {
        console.warn('导入警告：', result.warnings);
      }
    }

    // 重置文件输入
    e.target.value = '';
  }, [importProjectConfig]);

  // 快速保存项目
  const handleQuickSave = useCallback(() => {
    setProjectNameInput(projectBaseInfo.name || '未命名项目');
    setProjectDescriptionInput('');
    setShowQuickSaveDialog(true);
  }, [projectBaseInfo.name]);

  const handleQuickSaveConfirm = useCallback(async () => {
    const name = projectNameInput.trim() || '未命名项目';
    await quickSaveProject(name, projectDescriptionInput.trim() || undefined);
    setShowQuickSaveDialog(false);
  }, [projectNameInput, projectDescriptionInput, quickSaveProject]);

  // Memoize metrics data to prevent recreation on each render
  const metricsData = useMemo(() => [
    {
      title: '内部收益率 (IRR)',
      value: `${projectIRR.toFixed(2)}%`,
      icon: 'trending_up',
      change: projectIRR > 10 ? '+优' : '',
      sub: projectIRR > 0 ? '全生命周期测算' : '暂无数据',
      color: projectIRR > 8 ? 'text-emerald-600' : 'text-slate-800',
    },
    {
      title: '预测年收益 (万元)',
      value: `¥ ${totalSaving.toFixed(2)}`,
      icon: 'verified',
      change: totalSaving > 0 ? '+实测' : '',
      sub: '年度综合节能',
      color: 'text-indigo-600',
    },
    {
      title: '预估总投资额',
      value: `¥ ${totalInvestment.toFixed(2)}万`,
      icon: 'account_balance_wallet',
      sub: projectBaseInfo.spvConfig ? `杠杆率 ${projectBaseInfo.spvConfig.debtRatio}%` : '全自投模式',
      color: 'text-slate-800',
      extra: (
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
            <path className="text-amber-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="currentColor" strokeDasharray={`${Math.min(100, (totalInvestment / 500) * 100)}, 100`} strokeWidth="4"></path>
          </svg>
        </div>
      )
    },
    {
      title: '静态回收期 (年)',
      value: payback > 0 ? payback.toFixed(2) : '-',
      icon: 'timer',
      sub: payback > 0 && payback < 5 ? '极速回本' : '投资回报正常',
      color: 'text-slate-800',
      extra: (
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
            <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="currentColor" strokeDasharray={`${Math.min(100, (10 / payback) * 20)}, 100`} strokeWidth="4"></path>
          </svg>
        </div>
      )
    },
  ], [projectIRR, totalSaving, totalInvestment, payback, projectBaseInfo.spvConfig]);

  // Memoize table data to prevent recreation on each render
  const tableData = useMemo(() => {
    return activeModules.map((m: any) => {
      const type = m.name;
      const code = type.includes('光伏') ? 'PV' : type.includes('储能') ? 'ES' : type.includes('暖通') ? 'HV' : type.includes('照明') ? 'L' : 'O';
      const color = type.includes('光伏') ? 'bg-green-100 text-green-600' : type.includes('储能') ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600';

      return {
        type,
        code,
        codeColor: color,
        loc: projectBaseInfo.city || '本地园区',
        date: '2024.Q1',
        status: m.yearlySaving > 0 ? '测算完成' : '评估中',
        statusColor: m.yearlySaving > 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
        save: `￥${(m.yearlySaving || 0).toFixed(2)}万/年`
      };
    });
  }, [activeModules, projectBaseInfo.city]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* 项目导入导出工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800">仪表盘</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProjectManager(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
            title="管理已保存的项目"
          >
            <span className="material-symbols-outlined text-[18px]">folder</span>
            项目管理
          </button>
          <button
            onClick={handleQuickSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            快速保存
          </button>
          <button
            onClick={() => exportProjectConfig()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            导出配置
          </button>
          <button
            onClick={handleImportProject}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">upload</span>
            导入配置
          </button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* 快速保存对话框 */}
      {showQuickSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">保存项目</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">项目名称</label>
                <input
                  type="text"
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="输入项目名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">项目描述（可选）</label>
                <textarea
                  value={projectDescriptionInput}
                  onChange={(e) => setProjectDescriptionInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 h-20 resize-none"
                  placeholder="输入项目描述..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowQuickSaveDialog(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleQuickSaveConfirm}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start z-10">
              <div>
                <p className="text-xs font-medium text-slate-500">{item.title}</p>
                <h3 className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</h3>
              </div>
              {!item.extra ? (
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
              ) : item.extra}
            </div>
            <div className="flex items-center gap-2 mt-4 z-10">
              {item.change && (
                <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">
                  <span className="material-symbols-outlined text-[12px] mr-0.5">north</span>
                  {item.change}
                </span>
              )}
              {item.sub && <span className="text-[10px] text-slate-400">{item.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">能源节省预测分析</h3>
              <p className="text-xs text-slate-400">点击图例隐藏/显示系列，拖动滑块缩放查看</p>
            </div>
            <button className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg text-xs font-medium text-slate-600">
              年度 <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
          </div>
          <div className="flex-1 w-full" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dynamicChartData} barSize={14} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                  labelStyle={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                  onClick={handleLegendClick}
                />
                <Bar name="基准能耗 (Baseline)" dataKey="base" fill="#cbd5e1" radius={[4, 4, 0, 0]} hide={!visibleSeries.base} />
                <Bar name="改造后能耗 (Predicted)" dataKey="current" fill="#4f46e5" radius={[4, 4, 0, 0]} hide={!visibleSeries.current} />
                <Brush dataKey="name" height={20} stroke="#cbd5e1" travellerWidth={10} tickFormatter={() => ''} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-center flex-1">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                <span className="material-symbols-outlined text-[24px]">savings</span>
              </div>
              <span className="px-2 py-0.5 rounded-full border border-purple-200 text-purple-600 text-[10px] font-bold">+{totalInvestment > 0 ? ((totalSaving / totalInvestment) * 100).toFixed(1) : 0}%</span>
            </div>
            <p className="text-xs text-slate-500">预计年化收益</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">¥{(totalSaving * 1).toFixed(2)}万</h3>
            <p className="text-[10px] text-slate-400 mt-1">基于当前配置模型</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-center flex-1">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                <span className="material-symbols-outlined text-[24px]">calculate</span>
              </div>
              <span className="px-2 py-0.5 rounded-full border border-green-200 text-green-600 text-[10px] font-bold">IRR</span>
            </div>
            <p className="text-xs text-slate-500">内部收益率 (IRR)</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">{projectIRR.toFixed(2)}%</h3>
            <p className="text-[10px] text-slate-400 mt-1">25年全周期测算</p>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-800">改造模块效益明细</h3>
          <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">refresh</span></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="font-medium py-2">技术类型</th>
                <th className="font-medium py-2">实施地点</th>
                <th className="font-medium py-2">预估完工</th>
                <th className="font-medium py-2">评估状态</th>
                <th className="font-medium py-2 text-right">预估节省 (月)</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {tableData.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                  <td className="py-3 flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${row.codeColor}`}>{row.code}</div>
                    <span className="font-medium">{row.type}</span>
                  </td>
                  <td className="py-3 text-slate-500">{row.loc}</td>
                  <td className="py-3 text-slate-500">{row.date}</td>
                  <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${row.statusColor}`}>{row.status}</span></td>
                  <td className="py-3 text-right font-medium">{row.save}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 项目管理对话框 */}
      {showProjectManager && (
        <ProjectManager onClose={() => setShowProjectManager(false)} onChangeView={onChangeView} />
      )}
    </div>
  );
};

export default Dashboard;