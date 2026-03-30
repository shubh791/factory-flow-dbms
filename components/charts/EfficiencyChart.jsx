'use client';

import BaseChart from './BaseChart';

export default function EfficiencyChart({ records }) {
  if (!records || !records.length) {
    return (
      <div
        className="rounded-xl flex items-center justify-center h-[360px]"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <p style={{ color: '#54546a', fontSize: 13 }}>No production data available</p>
      </div>
    );
  }

  const deptMap = {};
  records.forEach((r) => {
    const dept = r.employee?.department?.name;
    if (!dept) return;
    if (!deptMap[dept]) deptMap[dept] = { units: 0, defects: 0 };
    deptMap[dept].units   += Number(r.units)   || 0;
    deptMap[dept].defects += Number(r.defects) || 0;
  });

  const departments = Object.keys(deptMap);
  if (!departments.length) {
    return (
      <div
        className="rounded-xl flex items-center justify-center h-[360px]"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <p style={{ color: '#54546a', fontSize: 13 }}>No department-linked records</p>
      </div>
    );
  }

  const effArr = departments.map((dept) => {
    const { units, defects } = deptMap[dept];
    return units > 0 ? Number((((units - defects) / units) * 100).toFixed(2)) : 0;
  });

  const avg      = effArr.reduce((a, b) => a + b, 0) / effArr.length;
  const bestIdx  = effArr.indexOf(Math.max(...effArr));
  const worstIdx = effArr.indexOf(Math.min(...effArr));

  const barColors = effArr.map((v) =>
    v >= 98 ? '#10b981' : v >= 95 ? '#f59e0b' : '#f43f5e'
  );

  const options = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f1f28',
      borderColor: '#3a3a4a',
      borderWidth: 1,
      textStyle: { color: '#f0f0f4', fontSize: 12 },
      formatter: (p) => `<b>${p[0].name}</b><br/>Efficiency: <b>${p[0].value}%</b>`,
    },
    grid: { left: 130, right: 60, top: 12, bottom: 20 },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: '#54546a', fontSize: 11 },
      splitLine: { lineStyle: { color: '#1f1f28', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: departments,
      axisLabel: { color: '#9090a4', fontSize: 12, fontWeight: 500 },
      axisLine: { lineStyle: { color: '#2c2c38' } },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: effArr,
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: (p) => barColors[p.dataIndex],
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: '#9090a4',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'JetBrains Mono, monospace',
        },
        markLine: {
          symbol: 'none',
          silent: true,
          lineStyle: { type: 'dashed', color: '#3a3a4a', width: 1 },
          label: {
            formatter: '95% target',
            color: '#54546a',
            fontSize: 10,
            position: 'insideEndTop',
          },
          data: [{ xAxis: 95 }],
        },
      },
    ],
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#17171c', border: '1px solid #1f1f28' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid #1f1f28' }}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.01em' }}>
            Department Efficiency
          </p>
          <p style={{ fontSize: 11, color: '#54546a', marginTop: 2 }}>
            Performance comparison via relational DBMS
          </p>
        </div>
        <span
          style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '3px 9px', borderRadius: 9999,
            background: 'rgba(99,102,241,0.10)', color: '#818cf8',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          {departments.length} Depts
        </span>
      </div>

      {/* Chart */}
      <div style={{ padding: '16px 20px' }}>
        <BaseChart option={options} height="320px" />
      </div>

      {/* Stats footer */}
      <div
        className="grid grid-cols-3 gap-0"
        style={{ borderTop: '1px solid #1f1f28', background: 'rgba(0,0,0,0.15)' }}
      >
        {[
          { label: 'Avg Efficiency',    value: `${avg.toFixed(2)}%`,  color: '#f0f0f4' },
          { label: 'Best Dept',         value: departments[bestIdx],   color: '#10b981' },
          { label: 'Needs Improvement', value: departments[worstIdx],  color: '#f43f5e' },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: '14px 16px',
              borderRight: i < 2 ? '1px solid #1f1f28' : 'none',
            }}
          >
            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#54546a', fontWeight: 600, marginBottom: 4 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 15, fontWeight: 600, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
