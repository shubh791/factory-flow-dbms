'use client';

import { useEffect, useState } from 'react';
import API from '@/lib/api';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import FactoryIcon from '@mui/icons-material/Factory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GroupsIcon from '@mui/icons-material/Groups';
import { FaLightbulb, FaCheckCircle } from 'react-icons/fa';
import AIInsightPanel from '@/components/ai/AIInsightPanel';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });
const AskAIChat    = dynamic(() => import('@/components/ai/AskAIChat'),    { ssr: false });

const CARD_THEMES = [
  { accent: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  { accent: '#f43f5e', bg: 'rgba(244,63,94,0.08)'  },
  { accent: '#a855f7', bg: 'rgba(168,85,247,0.08)' },
  { accent: '#10b981', bg: 'rgba(16,185,129,0.08)' },
];

function KpiCard({ icon, title, value, index }) {
  const th = CARD_THEMES[index % CARD_THEMES.length];
  return (
    <div
      className="rounded-xl p-5 flex items-center gap-4 relative overflow-hidden"
      style={{ background: '#17171c', border: '1px solid #1f1f28', borderLeft: `2px solid ${th.accent}` }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }} />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: th.bg, color: th.accent }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#54546a', fontWeight: 600, marginBottom: 3 }}>
          {title}
        </p>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#f0f0f4', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ProductionInsights() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get('/analytics/production/insights')
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-7 h-7 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin mx-auto mb-4" />
          <p style={{ fontSize: 13, color: '#54546a' }}>Loading production intelligence...</p>
        </div>
      </div>
    );
  }

  const { totalUnits, totalDefects, efficiency, profit, projectedUnits, worstDepartment, monthlyTrend } = data;

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f1f28',
      borderColor: '#3a3a4a',
      borderWidth: 1,
      textStyle: { color: '#f0f0f4', fontSize: 12 },
    },
    legend: {
      data: ['Units', 'Defects'],
      textStyle: { color: '#9090a4', fontSize: 11 },
      top: 8,
    },
    grid: { left: 50, right: 20, top: 44, bottom: 36 },
    xAxis: {
      type: 'category',
      data: monthlyTrend.map((m) => m.month),
      axisLabel: { color: '#54546a', fontSize: 11 },
      axisLine: { lineStyle: { color: '#2c2c38' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#54546a', fontSize: 11 },
      splitLine: { lineStyle: { color: '#1f1f28', type: 'dashed' } },
      axisLine: { show: false },
    },
    series: [
      {
        name: 'Units', type: 'line', smooth: true,
        data: monthlyTrend.map((m) => m.units),
        lineStyle: { color: '#6366f1', width: 2.5 },
        itemStyle: { color: '#6366f1' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(99,102,241,0.25)' }, { offset: 1, color: 'rgba(99,102,241,0)' }] },
        },
      },
      {
        name: 'Defects', type: 'line', smooth: true,
        data: monthlyTrend.map((m) => m.defects),
        lineStyle: { color: '#f43f5e', width: 2 },
        itemStyle: { color: '#f43f5e' },
      },
    ],
  };

  const dbmsPoints = [
    'Backend aggregation eliminates frontend computation overhead.',
    'Indexed date fields optimize monthly grouping queries.',
    'Referential joins ensure accurate department-level insights.',
    'Centralized analytics improves strategic planning accuracy.',
    'Query-driven KPIs accelerate executive decision-making.',
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Page Header */}
      <div className="ff-page-header">
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24' }}
          >
            <FaLightbulb size={13} />
          </div>
          <p className="ff-label">Analytics · Deep Insights</p>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.02em' }}>
          Production Intelligence & Organisational Impact
        </h1>
        <p style={{ fontSize: 12, color: '#54546a', marginTop: 4 }}>
          All insights generated directly from relational DBMS queries and normalized data
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={<FactoryIcon fontSize="small" />}       title="Total Units"      value={totalUnits.toLocaleString()}    index={0} />
        <KpiCard icon={<WarningAmberIcon fontSize="small" />}  title="Total Defects"    value={totalDefects.toLocaleString()}  index={1} />
        <KpiCard icon={<TrendingUpIcon fontSize="small" />}    title="Efficiency"       value={`${efficiency.toFixed(2)}%`}   index={2} />
        <KpiCard icon={<AttachMoneyIcon fontSize="small" />}   title="Net Profit"       value={`₹${profit.toLocaleString()}`} index={3} />
      </div>

      {/* Alert Banners */}
      {projectedUnits && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <TrendingUpIcon style={{ color: '#818cf8', fontSize: 16, marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#9090a4', lineHeight: 1.6 }}>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>Forecast: </span>
            Projected next-period output is{' '}
            <strong style={{ color: '#f0f0f4', fontFamily: 'JetBrains Mono, monospace' }}>
              {projectedUnits.toLocaleString()}
            </strong>{' '}
            units based on historical trend analysis.
          </p>
        </div>
      )}

      {worstDepartment && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <WarningAmberIcon style={{ color: '#fbbf24', fontSize: 16, marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#9090a4', lineHeight: 1.6 }}>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>Attention Required: </span>
            Lowest performing department is{' '}
            <strong style={{ color: '#f0f0f4' }}>{worstDepartment.name}</strong>{' '}
            (Efficiency: {worstDepartment.efficiency.toFixed(1)}%)
          </p>
        </div>
      )}

      {/* Monthly Trend Chart */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Monthly Production & Defect Trend</p>
          <p style={{ fontSize: 11, color: '#54546a', marginTop: 2 }}>Time-series analysis from indexed production records</p>
        </div>
        <div className="p-5">
          <ReactECharts option={chartOption} style={{ height: 360 }} />
        </div>
      </div>

      {/* DBMS Impact */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>DBMS Impact on Organisational Performance</p>
        </div>
        <div className="p-5 space-y-3">
          {dbmsPoints.map((point, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {i + 1}
              </span>
              <p style={{ fontSize: 13, color: '#9090a4', lineHeight: 1.6 }}>{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Workforce Optimization */}
      <AIInsightPanel
        title="Workforce Optimization"
        subtitle="AI-generated department efficiency rankings and reallocation recommendations"
        endpoint="/ai/workforce"
        cacheKey="ai-workforce"
        icon={<GroupsIcon style={{ fontSize: 15 }} />}
        color="#a855f7"
        autoFetch
        renderContent={(data) => (
          <div className="space-y-4">
            {/* Dept stats table */}
            {data.deptStats?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 380 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1f1f28' }}>
                      {['Department', 'Efficiency', 'Headcount', 'Units/Head'].map((h) => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 600, color: '#54546a' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.deptStats].sort((a, b) => b.efficiency - a.efficiency).map((dept, i) => (
                      <tr key={dept.name} style={{ borderBottom: '1px solid #1f1f28' }}>
                        <td style={{ padding: '8px 12px', fontSize: 12.5, fontWeight: 500, color: '#f0f0f4' }}>{dept.name}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: dept.efficiency >= 90 ? '#10b981' : dept.efficiency >= 75 ? '#f59e0b' : '#f43f5e', fontFamily: 'JetBrains Mono, monospace' }}>
                            {dept.efficiency}%
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: '#9090a4', fontFamily: 'JetBrains Mono, monospace' }}>{dept.headcount}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: '#9090a4', fontFamily: 'JetBrains Mono, monospace' }}>{dept.unitsPerHead.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Recommendations */}
            {data.recommendations?.length > 0 && (
              <div>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#54546a', fontWeight: 600, marginBottom: 8 }}>
                  AI Recommendations
                </p>
                <div className="space-y-2">
                  {data.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <FaCheckCircle size={10} style={{ color: '#a855f7', marginTop: 3, flexShrink: 0 }} />
                      <p style={{ fontSize: 12.5, color: '#9090a4', lineHeight: 1.6 }}>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      />

      {/* Ask AI */}
      <AskAIChat />

    </motion.div>
  );
}
