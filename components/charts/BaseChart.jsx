'use client';

import ReactECharts from 'echarts-for-react';

export default function BaseChart({
  option,
  height    = '360px',
  loading   = false,
  className = '',
  style     = {},
}) {
  if (!option) return null;

  return (
    <div className={`w-full ${className}`} style={{ height, ...style }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        notMerge
        lazyUpdate={false}
        showLoading={loading}
        loadingOption={{
          color:           '#6366f1',
          textColor:       '#9090a4',
          maskColor:       'rgba(17,17,22,0.6)',
          lineWidth:       3,
          spinnerRadius:   10,
        }}
        opts={{ renderer: 'canvas', devicePixelRatio: window.devicePixelRatio ?? 2 }}
      />
    </div>
  );
}
