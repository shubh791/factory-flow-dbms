'use client';

import BaseChart from './BaseChart';

export default function EmployeeTrendChart({ records }) {
  if (!records || !records.length) {
    return (
      <div
        className="rounded-xl flex items-center justify-center h-[220px]"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <div className="text-center">
          <p style={{ color: '#54546a', fontSize: 13 }}>No workforce data</p>
          <p style={{ color: '#30303e', fontSize: 11, marginTop: 4 }}>Link employees to production</p>
        </div>
      </div>
    );
  }

  const grouped      = {};
  const employeeSet  = new Set();
  let totalGoodUnits = 0;

  records.forEach((r) => {
    const date    = new Date(r.productionDate).toISOString().split('T')[0];
    const units   = Number(r.units)   || 0;
    const defects = Number(r.defects) || 0;
    const good    = units - defects;
    grouped[date]  = (grouped[date] ?? 0) + good;
    totalGoodUnits += good;
    if (r.employee?.id) employeeSet.add(r.employee.id);
  });

  const dates          = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
  const values         = dates.map((d) => grouped[d]);
  const totalEmployees = employeeSet.size;
  const avgOutput      = totalEmployees > 0 ? Math.round(totalGoodUnits / totalEmployees) : 0;

  const options = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f1f28',
      borderColor: '#3a3a4a',
      borderWidth: 1,
      textStyle: { color: '#f0f0f4', fontSize: 12 },
      formatter: (p) => `<b>${p[0].name}</b><br/>Good Units: ${p[0].value.toLocaleString()}`,
    },
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: 'category', show: false, data: dates },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'line',
        smooth: true,
        data: values,
        symbol: 'none',
        lineStyle: { width: 2.5, color: '#a855f7' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(168,85,247,0.28)' },
              { offset: 1, color: 'rgba(168,85,247,0.03)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ background: '#17171c', border: '1px solid #1f1f28', padding: '20px 20px 12px' }}
    >
      {/* Top inset shine */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }}
      />
      {/* Purple ambient */}
      <div
        className="absolute -top-8 -left-8 w-32 h-32 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.09) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      <div className="relative">
        <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: '#a855f7', marginBottom: 4 }}>
          Workforce Productivity
        </p>
        <p style={{ fontSize: 26, fontWeight: 600, color: '#f0f0f4', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
          {avgOutput.toLocaleString()}
        </p>
        <p style={{ fontSize: 10, color: '#54546a', marginTop: 4 }}>
          Avg output/employee · {totalEmployees} active
        </p>
      </div>

      <div className="mt-4" style={{ height: 110 }}>
        <BaseChart option={options} height="110px" />
      </div>
    </div>
  );
}
