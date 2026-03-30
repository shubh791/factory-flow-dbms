'use client';

import { useMemo } from 'react';
import BaseChart from '../charts/BaseChart';

export default function DefectAnalyticsSection({ records }) {
  const { trendKeys, trendValues, goodTrend, defectByProduct, totalDefects, totalUnits, defectRate, qualityIndex } = useMemo(() => {
    if (!records || !records.length) {
      return { trendKeys: [], trendValues: [], goodTrend: [], defectByProduct: [], totalDefects: 0, totalUnits: 0, defectRate: 0, qualityIndex: 100 };
    }

    // Daily trend
    const byDate = {};
    const byProduct = {};

    records.forEach((r) => {
      const d = new Date(r.productionDate);
      if (isNaN(d.getTime())) return;
      const dateKey = d.toISOString().split('T')[0];
      const units   = Number(r.units)   || 0;
      const defects = Number(r.defects) || 0;
      const prodName = r.product?.name ?? 'Unknown';

      if (!byDate[dateKey]) byDate[dateKey] = { defects: 0, good: 0 };
      byDate[dateKey].defects += defects;
      byDate[dateKey].good    += Math.max(units - defects, 0);

      if (!byProduct[prodName]) byProduct[prodName] = 0;
      byProduct[prodName] += defects;
    });

    const trendKeys   = Object.keys(byDate).sort();
    const trendValues = trendKeys.map((k) => byDate[k].defects);
    const goodTrend   = trendKeys.map((k) => byDate[k].good);

    const totalUnits   = records.reduce((s, r) => s + (Number(r.units)   || 0), 0);
    const totalDefects = records.reduce((s, r) => s + (Number(r.defects) || 0), 0);
    const defectRate   = totalUnits > 0 ? Number(((totalDefects / totalUnits) * 100).toFixed(2)) : 0;
    const qualityIndex = Number((100 - defectRate).toFixed(2));

    const defectByProduct = Object.entries(byProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return { trendKeys, trendValues, goodTrend, defectByProduct, totalDefects, totalUnits, defectRate, qualityIndex };
  }, [records]);

  // Area chart — defect trend
  const areaOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f1f28',
      borderColor: '#3a3a4a',
      borderWidth: 1,
      textStyle: { color: '#f0f0f4', fontSize: 12 },
    },
    grid: { left: 48, right: 12, top: 12, bottom: 36 },
    xAxis: {
      type: 'category',
      data: trendKeys,
      axisLabel: {
        color: '#7878a0', fontSize: 9,
        interval: Math.max(0, Math.floor(trendKeys.length / 8) - 1),
      },
      axisLine: { lineStyle: { color: '#2c2c38' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#7878a0', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1f1f28', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: 'Defective',
        type: 'line',
        data: trendValues,
        smooth: 0.4,
        symbol: 'none',
        lineStyle: { width: 2, color: '#f43f5e' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(244,63,94,0.22)' },
              { offset: 1, color: 'rgba(244,63,94,0.02)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#f59e0b', type: 'dashed', width: 1 },
          label: { formatter: 'Threshold', color: '#f59e0b', fontSize: 9 },
          data: [{ yAxis: Math.round((totalUnits * 0.03) / Math.max(trendKeys.length, 1)) }],
        },
      },
      {
        name: 'Good Units',
        type: 'line',
        data: goodTrend,
        smooth: 0.4,
        symbol: 'none',
        lineStyle: { width: 1.5, color: '#10b981' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16,185,129,0.12)' },
              { offset: 1, color: 'rgba(16,185,129,0.01)' },
            ],
          },
        },
      },
    ],
  };

  // Bar chart — defects by product
  const barOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f1f28',
      borderColor: '#3a3a4a',
      borderWidth: 1,
      textStyle: { color: '#f0f0f4', fontSize: 12 },
      formatter: (p) => `<b>${p[0].name}</b><br/>Defects: <b>${p[0].value.toLocaleString()}</b>`,
    },
    grid: { left: 100, right: 16, top: 8, bottom: 16 },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#7878a0', fontSize: 9 },
      splitLine: { lineStyle: { color: '#1f1f28', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: defectByProduct.map(([name]) => name),
      axisLabel: { color: '#9090a4', fontSize: 11 },
      axisLine: { lineStyle: { color: '#2c2c38' } },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: defectByProduct.map(([, v]) => v),
        barWidth: 12,
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: (p) => {
            const ratio = p.value / (defectByProduct[0]?.[1] || 1);
            if (ratio > 0.75) return '#f43f5e';
            if (ratio > 0.4)  return '#f59e0b';
            return '#10b981';
          },
        },
        label: {
          show: true, position: 'right',
          color: '#9090a4', fontSize: 10, fontWeight: 600,
          fontFamily: 'JetBrains Mono, monospace',
        },
      },
    ],
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.01em' }}>
            Defect & Quality Analytics
          </p>
          <p style={{ fontSize: 11, color: '#7878a0', marginTop: 2 }}>
            Defect patterns, thresholds, and product-wise comparison
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p style={{ fontSize: 9, color: '#54546a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Defect Rate</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#f43f5e', fontFamily: 'JetBrains Mono, monospace' }}>{defectRate}%</p>
          </div>
          <div style={{ width: 1, height: 32, background: '#1f1f28' }} />
          <div className="text-right">
            <p style={{ fontSize: 9, color: '#54546a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Quality Index</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>{qualityIndex}%</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-0">
        {/* Defect Trend Area Chart */}
        <div className="p-5" style={{ borderRight: '1px solid #1f1f28' }}>
          <p style={{ fontSize: 10, color: '#54546a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>
            Defect Trend Over Time
          </p>
          {trendKeys.length > 0 ? (
            <BaseChart option={areaOption} height="200px" />
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p style={{ color: '#54546a', fontSize: 12 }}>No data</p>
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            {[['#f43f5e', 'Defective Units'], ['#10b981', 'Good Units'], ['#f59e0b', '3% Threshold']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                <span style={{ fontSize: 10, color: '#7878a0' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Defect by Product Bar Chart */}
        <div className="p-5">
          <p style={{ fontSize: 10, color: '#54546a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>
            Defects by Product
          </p>
          {defectByProduct.length > 0 ? (
            <BaseChart option={barOption} height="200px" />
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p style={{ color: '#54546a', fontSize: 12 }}>No product data</p>
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            {[['#f43f5e', 'High'], ['#f59e0b', 'Medium'], ['#10b981', 'Low']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                <span style={{ fontSize: 10, color: '#7878a0' }}>{l} defect</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
