'use client';

import { useMemo } from 'react';
import BaseChart from '../charts/BaseChart';

export default function FinancialImpactSection({ records }) {
  const { keys, revenueByPeriod, totalRevenue, avgRevenue, maxRevenue, maxPeriod, growth } = useMemo(() => {
    if (!records || !records.length) {
      return { keys: [], revenueByPeriod: [], totalRevenue: 0, avgRevenue: 0, maxRevenue: 0, maxPeriod: '—', growth: 0 };
    }

    const byMonth = {};
    records.forEach((r) => {
      const d = new Date(r.productionDate);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      byMonth[key] = (byMonth[key] ?? 0) + (Number(r.revenue) || 0);
    });

    const keys = Object.keys(byMonth);
    const revenueByPeriod = keys.map((k) => byMonth[k]);

    const totalRevenue = revenueByPeriod.reduce((a, b) => a + b, 0);
    const avgRevenue   = keys.length > 0 ? Math.round(totalRevenue / keys.length) : 0;
    const maxRevenue   = Math.max(...revenueByPeriod);
    const maxPeriod    = keys[revenueByPeriod.indexOf(maxRevenue)] ?? '—';

    // Month-over-month growth: compare last period to second-last
    const n = revenueByPeriod.length;
    const growth = n >= 2 && revenueByPeriod[n - 2] > 0
      ? Number((((revenueByPeriod[n - 1] - revenueByPeriod[n - 2]) / revenueByPeriod[n - 2]) * 100).toFixed(1))
      : 0;

    return { keys, revenueByPeriod, totalRevenue, avgRevenue, maxRevenue, maxPeriod, growth };
  }, [records]);

  const growthUp = growth >= 0;

  const barOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f1f28',
      borderColor: '#3a3a4a',
      borderWidth: 1,
      textStyle: { color: '#f0f0f4', fontSize: 12 },
      formatter: (p) =>
        `<b>${p[0].name}</b><br/>Revenue: <b>₹${Number(p[0].value).toLocaleString()}</b>`,
    },
    grid: { left: 60, right: 16, top: 20, bottom: 36 },
    xAxis: {
      type: 'category',
      data: keys,
      axisLabel: { color: '#7878a0', fontSize: 10 },
      axisLine: { lineStyle: { color: '#2c2c38' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#7878a0',
        fontSize: 10,
        formatter: (v) => `₹${v >= 1_00_000 ? `${(v / 1_00_000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`,
      },
      splitLine: { lineStyle: { color: '#1f1f28', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: revenueByPeriod,
        barWidth: '50%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: (p) => {
            const ratio = p.value / (maxRevenue || 1);
            if (ratio === 1) return { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#818cf8' }, { offset: 1, color: '#6366f1' }] };
            if (ratio > 0.7) return 'rgba(99,102,241,0.7)';
            return 'rgba(99,102,241,0.35)';
          },
        },
      },
      {
        type: 'line',
        data: revenueByPeriod,
        smooth: 0.4,
        symbol: 'none',
        lineStyle: { width: 2, color: '#10b981' },
        itemStyle: { color: '#10b981' },
      },
    ],
  };

  const fmt = (n) => {
    if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
    if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)}L`;
    if (n >= 1000)        return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${n.toLocaleString()}`;
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.01em' }}>
            Financial Impact Analytics
          </p>
          <p style={{ fontSize: 11, color: '#7878a0', marginTop: 2 }}>
            Revenue aggregation from structured production-product joins
          </p>
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
          style={{
            color:      growthUp ? '#10b981' : '#f43f5e',
            background: growthUp ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
            border:     `1px solid ${growthUp ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
          }}
        >
          {growthUp ? '↑' : '↓'} {Math.abs(growth)}% MoM
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-0" style={{ borderBottom: '1px solid #1f1f28' }}>
        {[
          { label: 'Total Revenue',  value: fmt(totalRevenue), color: '#f0f0f4' },
          { label: 'Avg / Month',    value: fmt(avgRevenue),   color: '#818cf8' },
          { label: 'Peak Month',     value: maxPeriod,         color: '#10b981' },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: '12px 20px',
              borderRight: i < 2 ? '1px solid #1f1f28' : 'none',
            }}
          >
            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#54546a', fontWeight: 600, marginBottom: 4 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ padding: '16px 20px 20px' }}>
        {keys.length > 0 ? (
          <BaseChart option={barOption} height="220px" />
        ) : (
          <div className="flex items-center justify-center h-[220px]">
            <p style={{ color: '#54546a', fontSize: 13 }}>No revenue data available</p>
          </div>
        )}
        <div className="flex items-center gap-4 mt-2">
          {[['#6366f1', 'Revenue (bar)'], ['#10b981', 'Trend line']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: c }} />
              <span style={{ fontSize: 10, color: '#7878a0' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
