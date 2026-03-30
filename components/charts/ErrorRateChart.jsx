'use client';

import BaseChart from './BaseChart';

export default function ErrorRateChart({ records }) {
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

  const totalUnits   = records.reduce((s, r) => s + (Number(r.units)   || 0), 0);
  const totalDefects = records.reduce((s, r) => s + (Number(r.defects) || 0), 0);
  const goodUnits    = Math.max(totalUnits - totalDefects, 0);
  const defectRate   = totalUnits > 0 ? ((totalDefects / totalUnits) * 100).toFixed(2) : 0;
  const qualityIndex = (100 - defectRate).toFixed(2);

  const options = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1f1f28',
      borderColor: '#3a3a4a',
      borderWidth: 1,
      textStyle: { color: '#f0f0f4', fontSize: 12 },
      formatter: (p) =>
        `<b>${p.name}</b><br/>${p.value.toLocaleString()} units (${p.percent}%)`,
    },
    legend: {
      bottom: 8,
      textStyle: { color: '#9090a4', fontSize: 11 },
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 20,
    },
    series: [
      {
        name: 'Quality Distribution',
        type: 'pie',
        radius: ['52%', '72%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#17171c', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 15, fontWeight: 700, color: '#f0f0f4' },
          itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.5)' },
        },
        data: [
          {
            value: goodUnits,
            name: 'Good Units',
            itemStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#34d399' }],
              },
            },
          },
          {
            value: totalDefects,
            name: 'Defective Units',
            itemStyle: {
              color: {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [{ offset: 0, color: '#f43f5e' }, { offset: 1, color: '#fb7185' }],
              },
            },
          },
        ],
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
            Quality Index & Defect Ratio
          </p>
          <p style={{ fontSize: 11, color: '#54546a', marginTop: 2 }}>
            Enterprise-grade quality monitoring via DBMS
          </p>
        </div>
      </div>

      {/* Stat pills */}
      <div
        className="grid grid-cols-2"
        style={{ borderBottom: '1px solid #1f1f28' }}
      >
        <div style={{ padding: '12px 20px', borderRight: '1px solid #1f1f28' }}>
          <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#54546a', fontWeight: 600, marginBottom: 3 }}>
            Defect Rate
          </p>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#f43f5e', fontFamily: 'JetBrains Mono, monospace' }}>
            {defectRate}%
          </p>
        </div>
        <div style={{ padding: '12px 20px' }}>
          <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#54546a', fontWeight: 600, marginBottom: 3 }}>
            Quality Index
          </p>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
            {qualityIndex}%
          </p>
        </div>
      </div>

      {/* Donut chart with center label */}
      <div style={{ position: 'relative', padding: '16px 20px 20px', height: 320 }}>
        <BaseChart option={options} height="288px" />
        <div
          style={{
            position: 'absolute',
            top: '44%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#54546a', fontWeight: 600 }}>
            Quality
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f4', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.1 }}>
            {qualityIndex}%
          </p>
        </div>
      </div>
    </div>
  );
}
