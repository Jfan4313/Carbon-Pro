import React, { useState } from 'react';
import { useMicrogrid } from './hooks';
import type { MicrogridProjectData } from './types';

/**
 * 微电网模块主组件
 * 提供微电网项目配置和收益分析功能
 */
export default function RetrofitMicrogrid() {
  const { projectData, updateProjectData, calculateROI, calculatePaybackPeriod } = useMicrogrid();
  const [activeTab, setActiveTab] = useState<'basic' | 'capacity' | 'financial'>('basic');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">微电网项目配置</h1>
        <p className="text-sm text-gray-500 mt-1">配置微电网系统参数，分析项目收益</p>
      </div>

      {/* 选项卡 */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-6">
          {[
            { id: 'basic', label: '基础信息' },
            { id: 'capacity', label: '容量配置' },
            { id: 'financial', label: '财务分析' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'basic' && (
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">项目基础信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  项目名称
                </label>
                <input
                  type="text"
                  value={projectData.projectName}
                  onChange={(e) => updateProjectData('projectName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="请输入项目名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  项目类型
                </label>
                <select
                  value={projectData.projectType}
                  onChange={(e) => updateProjectData('projectType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="campus">园区</option>
                  <option value="factory">工厂</option>
                  <option value="community">社区</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'capacity' && (
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">容量配置</h2>
            <div className="space-y-6">
              {[
                { key: 'totalCapacity', label: '总容量', unit: 'kW', min: 0, max: 10000 },
                { key: 'renewableCapacity', label: '可再生能源容量', unit: 'kW', min: 0, max: 5000 },
                { key: 'storageCapacity', label: '储能容量', unit: 'kWh', min: 0, max: 2000 },
                { key: 'loadCapacity', label: '负荷容量', unit: 'kW', min: 0, max: 3000 }
              ].map(({ key, label, unit, min, max }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label} ({unit})
                  </label>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={projectData[key as keyof MicrogridProjectData] as number}
                    onChange={(e) => updateProjectData(key as keyof MicrogridProjectData, Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="mt-1 text-sm text-gray-500">
                    当前值: {projectData[key as keyof MicrogridProjectData]} {unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">财务参数</h2>
              <div className="space-y-4">
                {[
                  { key: 'investment', label: '初始投资', unit: '元' },
                  { key: 'operationCost', label: '运营成本', unit: '元/年' },
                  { key: 'maintenanceCost', label: '维护成本', unit: '元/年' },
                  { key: 'electricitySavings', label: '节电收益', unit: '元/年' },
                  { key: 'annualRevenue', label: '年度收入', unit: '元/年' }
                ].map(({ key, label, unit }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {label} ({unit})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={projectData[key as keyof MicrogridProjectData] as number}
                      onChange={(e) => updateProjectData(key as keyof MicrogridProjectData, Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      {formatCurrency(projectData[key as keyof MicrogridProjectData] as number)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
                <div className="text-sm opacity-80 mb-1">投资回报率 (ROI)</div>
                <div className="text-3xl font-bold">{calculateROI.toFixed(2)}%</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
                <div className="text-sm opacity-80 mb-1">投资回收期</div>
                <div className="text-3xl font-bold">{calculatePaybackPeriod.toFixed(1)} 年</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
