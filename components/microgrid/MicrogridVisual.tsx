import React from 'react';

/**
 * 微电网可视化组件
 * 展示微电网系统运行状态和能量流动
 */
interface MicrogridVisualProps {
  data?: any;
}

export default function MicrogridVisual({ data }: MicrogridVisualProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">微电网运行状态</h3>
        <p className="text-sm text-gray-600">系统运行正常</p>
        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-gray-500 mb-1">发电量</div>
            <div className="font-semibold text-gray-800">--</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-gray-500 mb-1">用电量</div>
            <div className="font-semibold text-gray-800">--</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-gray-500 mb-1">储能</div>
            <div className="font-semibold text-gray-800">--</div>
          </div>
        </div>
      </div>
    </div>
  );
}
