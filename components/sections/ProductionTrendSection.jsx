'use client';

import { useState, useMemo } from 'react';
import BaseChart from '../charts/BaseChart';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

function groupRecords(records, period) {
  const map = {};
  records.forEach((r) => {
    const d = new Date(r.productionDate);
    if (isNaN(d.getTime())) return;
    let key;
    if (period === 'daily') {
      key = d.toISOString().split('T')[0];
    } else if (period === 'weekly') {
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      key = `Wk ${monday.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
    } else {
      key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }
    if (!map[key]) map[key] = { units: 0, defects: 0, revenue: 0 };
    map[key].units   += Number(r.units)   || 0;
    map[key].defects += Number(r.defects) || 0;
    map[key].revenue += Number(r.revenue) || 0;
  });

  // For daily we can sort lexically (ISO dates sort correctly), others keep insertion order
  const keys = period === 'daily'
    ? Object.keys(map).sort()
    : Object.keys(map);

  return { keys, map };
}

export default function ProductionTrendSection({ records }) {
  const [period, setPeriod] = useState('daily');

  const { keys, map, totalUnits, avgPerPeriod, delta, peakPeriod, peakValue } = useMemo(() => {
    if (!records || !records.length) {
      return { keys: [], map: {}, totalUnits: 0, avgPerPeriod: 0, delta: 0, peakPeriod: '—', peakValue: 0 };
    }
    const { keys, map } = groupRecords(records, period);
    const values = keys.map((k) => map[k].units);
    const totalUnits = values.reduce((a, b) => a + b, 0);
    const avgPerPeriod = values.length > 0 ? Math.round(totalUnits / values.length) : 0;

    // Trend: last 3 vs previous 3 periods
    const recent = values.slice(-3).reduce((a, b) => a + b, 0);
    const prev = values.slice(-6, -3).reduce((a, b) => a + b, 0);
    const delta = prev > 0 ? Number((((recent - prev) / prev) * 100).toFixed(1)) : 0;

    const peakIdx = values.indexOf(Math.max(...values));
    const peakPeriod = keys[peakIdx] ?? '—';
    const peakValue = values[peakIdx] ?? 0;

    return { keys, map, totalUnits, avgPerPeriod, delta, peakPeriod, peakValue };
  }, [records, period]);

  const trendUp = delta >= 0;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f1f28',
      borderColor: '#3a3a4a',
      borderWidth: 1,
      textStyle: { color: '#f0f0f4', fontSize: 12 },
      formatter: (p) => `<b>${p[0].name}</b><br/>Units: <b>${p[0].value.toLocaleString()}</b>`,
    },
    grid: { left: 56, right: 16, top: 16, bottom: keys.length > 12 ? 48 : 32 },
    xAxis: {
      type: 'category',
      data: keys,
      axisLabel: {
        color: '#7878a0',
        fontSize: 10,
        rotate: keys.length > 12 ? 35 : 0,
        interval: Math.max(0, Math.floor(keys.length / 12) - 1),
      },
      axisLine: { lineStyle: { color: '#2c2c38' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#7878a0',
        fontSize: 10,
        formatter: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v),
      },
      splitLine: { lineStyle: { color: '#1f1f28', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'line',
        data: keys.map((k) => map[k]?.units ?? 0),
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2.5, color: '#6366f1' },
        itemStyle: { color: '#6366f1', borderColor: '#111116', borderWidth: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(99,102,241,0.22)' },
              { offset: 1, color: 'rgba(99,102,241,0.02)' },
            ],
          },
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 30,
          itemStyle: { color: '#6366f1' },
          label: { color: '#fff', fontSize: 9, fontWeight: 700 },
          data: [{ type: 'max', name: 'Peak' }],
        },
      },
    ],
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.01em' }}>
            Production Trend Intelligence
          </p>
          <p style={{ fontSize: 11, color: '#7878a0', marginTop: 2 }}>
            Units produced over time — relational aggregation
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition"
              style={{
                background: period === p ? 'rgba(99,102,241,0.18)' : 'rgba(0,0,0,0.15)',
                color:      period === p ? '#818cf8' : '#7878a0',
                border:     `1px solid ${period === p ? 'rgba(99,102,241,0.35)' : '#2c2c38'}`,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap items-center gap-4 px-5 pt-4">
        {[
          { label: 'Total Units',    value: totalUnits.toLocaleString(),    color: '#f0f0f4' },
          { label: `Avg / ${period.replace('ly','')}`, value: avgPerPeriod.toLocaleString(), color: '#9090a4' },
          { label: 'Peak Period',    value: peakPeriod,                     color: '#818cf8' },
          { label: 'Peak Output',    value: peakValue.toLocaleString(),     color: '#818cf8' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span style={{ fontSize: 9, color: '#54546a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</span>
          </div>
        ))}
        <div
          className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
          style={{
            color:      trendUp ? '#10b981' : '#f43f5e',
            background: trendUp ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
            border:     `1px solid ${trendUp ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
          }}
        >
          {trendUp ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
          {Math.abs(delta)}% trend
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: '12px 16px 20px' }}>
        {keys.length > 0 ? (
          <BaseChart option={option} height="220px" />
        ) : (
          <div className="flex items-center justify-center h-[220px]">
            <p style={{ color: '#54546a', fontSize: 13 }}>No production data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
