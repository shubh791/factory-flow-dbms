'use client';

import { useMemo } from 'react';
import BaseChart from '../charts/BaseChart';

export default function DeptPerformanceSection({ records }) {
  const { depts, radarData, topDept, bottomDept, deptCards } = useMemo(() => {
    if (!records || !records.length) {
      return { depts: [], radarData: [], topDept: null, bottomDept: null, deptCards: [] };
    }

    const map = {};
    records.forEach((r) => {
      const dept = r.employee?.department?.name;
      if (!dept) return;
      if (!map[dept]) map[dept] = { units: 0, defects: 0, revenue: 0, employees: new Set() };
      map[dept].units   += Number(r.units)   || 0;
      map[dept].defects += Number(r.defects) || 0;
      map[dept].revenue += Number(r.revenue) || 0;
      if (r.employee?.id) map[dept].employees.add(r.employee.id);
    });

    const depts = Object.keys(map);
    const maxUnits   = Math.max(...depts.map((d) => map[d].units));
    const maxRevenue = Math.max(...depts.map((d) => map[d].revenue));

    const deptCards = depts.map((dept) => {
      const { units, defects, revenue, employees } = map[dept];
      const efficiency = units > 0 ? Number((((units - defects) / units) * 100).toFixed(1)) : 0;
      const empCount   = employees.size;
      return { dept, units, defects, revenue, efficiency, empCount };
    });

    // Sort by efficiency for top/bottom
    const sorted = [...deptCards].sort((a, b) => b.efficiency - a.efficiency);
    const topDept    = sorted[0] ?? null;
    const bottomDept = sorted[sorted.length - 1] ?? null;

    // Radar data — normalize to 0-100 scale
    const radarData = depts.map((dept) => {
      const { units, defects, revenue, employees } = map[dept];
      const efficiency  = units > 0 ? ((units - defects) / units) * 100 : 0;
      const volumeScore = maxUnits   > 0 ? (units   / maxUnits)   * 100 : 0;
      const revScore    = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
      const qualScore   = 100 - (units > 0 ? (defects / units) * 100 : 0);
      const empScore    = Math.min(employees.size * 20, 100); // cap at 5+ employees = 100
      return { dept, values: [efficiency, volumeScore, revScore, qualScore, empScore] };
    });

    return { depts, radarData, topDept, bottomDept, deptCards };
  }, [records]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#14b8a6', '#38bdf8'];

  const radarOption = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: '#1f1f28',
      borderColor: '#3a3a4a',
      borderWidth: 1,
      textStyle: { color: '#f0f0f4', fontSize: 12 },
    },
    legend: {
      bottom: 4,
      textStyle: { color: '#9090a4', fontSize: 10 },
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 16,
    },
    radar: {
      indicator: [
        { name: 'Efficiency',  max: 100 },
        { name: 'Volume',      max: 100 },
        { name: 'Revenue',     max: 100 },
        { name: 'Quality',     max: 100 },
        { name: 'Workforce',   max: 100 },
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#9090a4', fontSize: 10, fontWeight: 600 },
      splitLine: { lineStyle: { color: '#2c2c38' } },
      splitArea: {
        areaStyle: {
          color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.01)', 'rgba(255,255,255,0.02)'],
        },
      },
      axisLine: { lineStyle: { color: '#2c2c38' } },
    },
    series: [
      {
        type: 'radar',
        data: radarData.map(({ dept, values }, i) => ({
          name: dept,
          value: values,
          lineStyle: { color: COLORS[i % COLORS.length], width: 1.5 },
          itemStyle: { color: COLORS[i % COLORS.length] },
          areaStyle: { color: `${COLORS[i % COLORS.length]}18` },
        })),
      },
    ],
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.01em' }}>
            Department Performance Matrix
          </p>
          <p style={{ fontSize: 11, color: '#7878a0', marginTop: 2 }}>
            Multi-dimensional efficiency, volume, revenue & quality radar
          </p>
        </div>
        <span
          style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '3px 9px', borderRadius: 9999,
            background: 'rgba(99,102,241,0.1)', color: '#818cf8',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          {depts.length} Depts
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-0">
        {/* Radar chart */}
        <div className="lg:col-span-2 p-5" style={{ borderRight: '1px solid #1f1f28' }}>
          {depts.length > 0 ? (
            <BaseChart option={radarOption} height="300px" />
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p style={{ color: '#54546a', fontSize: 13 }}>No department data</p>
            </div>
          )}
        </div>

        {/* Dept summary cards */}
        <div className="p-5 flex flex-col gap-3">
          <p style={{ fontSize: 10, color: '#54546a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>
            Dept Rankings
          </p>

          {deptCards
            .sort((a, b) => b.efficiency - a.efficiency)
            .map(({ dept, efficiency, units, empCount }, idx) => {
              const isTop    = idx === 0;
              const isBottom = idx === deptCards.length - 1 && deptCards.length > 1;
              const color    = isTop ? '#10b981' : isBottom ? '#f43f5e' : COLORS[idx % COLORS.length];
              const pct      = efficiency;
              return (
                <div
                  key={dept}
                  className="rounded-xl p-3"
                  style={{
                    background: isTop ? 'rgba(16,185,129,0.05)' : isBottom ? 'rgba(244,63,94,0.05)' : 'rgba(0,0,0,0.15)',
                    border: `1px solid ${isTop ? 'rgba(16,185,129,0.15)' : isBottom ? 'rgba(244,63,94,0.15)' : '#1f1f28'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f4' }}>{dept}</span>
                    </div>
                    <span
                      className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                      style={{
                        color,
                        background: `${color}14`,
                        border: `1px solid ${color}28`,
                      }}
                    >
                      {isTop ? 'Top' : isBottom ? 'Review' : `#${idx + 1}`}
                    </span>
                  </div>
                  {/* Efficiency bar */}
                  <div className="rounded-full overflow-hidden mb-1.5" style={{ height: 4, background: '#2c2c38' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: 'width 0.6s ease' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 10, color: '#54546a' }}>{units.toLocaleString()} units</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
