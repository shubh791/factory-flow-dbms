'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { FaFlask, FaCheckCircle, FaDatabase, FaServer } from 'react-icons/fa';

const BaseChart = dynamic(() => import('@/components/charts/BaseChart'), { ssr: false });

/* ── Static benchmark dataset ─────────────────────────────────────── */
const DATABASES = [
  { name: 'PostgreSQL', short: 'PG',    color: '#6366f1', tagColor: '#818cf8' },
  { name: 'MySQL',      short: 'MY',    color: '#10b981', tagColor: '#34d399' },
  { name: 'MongoDB',    short: 'MG',    color: '#f59e0b', tagColor: '#fbbf24' },
  { name: 'Oracle',     short: 'OR',    color: '#f43f5e', tagColor: '#fb7185' },
];

// Benchmark values (higher = better, normalized 0–100)
const METRICS = [
  { key: 'Complex Joins',      values: [96, 72, 28, 98] },
  { key: 'Analytics Queries',  values: [94, 74, 58, 97] },
  { key: 'Write Throughput',   values: [82, 90, 99, 78] },
  { key: 'Read Throughput',    values: [90, 88, 94, 91] },
  { key: 'Data Consistency',   values: [98, 86, 72, 99] },
  { key: 'Scalability',        values: [88, 78, 94, 96] },
  { key: 'Cost Efficiency',    values: [88, 93, 82, 35] },
  { key: 'ACID Compliance',    values: [100, 95, 72, 100] },
];

// Absolute timing benchmarks (milliseconds, lower = better)
const TIMING = [
  { test: 'Simple SELECT (1k rows)',         values: [2.1, 2.4, 3.8, 1.9]  },
  { test: '5-table JOIN (100k rows)',         values: [12,  22,  145, 9]    },
  { test: 'Aggregation (GROUP BY dept)',      values: [8,   18,  32,  6]    },
  { test: 'Full-table scan (1M rows)',        values: [180, 240, 95,  160]  },
  { test: 'Concurrent inserts (1000 txns)',   values: [45,  38,  12,  52]   },
  { test: 'Index lookup (B-tree)',            values: [0.4, 0.5, 0.8, 0.3] },
];

const RECOMMENDATION = {
  useCase: 'Manufacturing ERP & Industrial Analytics',
  winner:  'PostgreSQL',
  reasons: [
    'Best-in-class JOIN performance for multi-table relational schemas',
    'Full ACID compliance ensures data integrity in production environments',
    'Advanced window functions enable efficient KPI aggregation',
    'Strong indexing on date/department columns accelerates dashboards',
    'Excellent cost-to-performance ratio vs. Oracle for similar workloads',
    'Native JSON support handles semi-structured sensor data alongside relational data',
  ],
};

export default function BenchmarkLab() {
  /* ── Radar chart ─────────────────────────────────────────────────── */
  const radarOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: '#1f1f28',
      borderColor: '#3a3a4a',
      borderWidth: 1,
      textStyle: { color: '#f0f0f4', fontSize: 12 },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#9090a4', fontSize: 11 },
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 20,
    },
    radar: {
      indicator: METRICS.map(({ key }) => ({ name: key, max: 100 })),
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
      radius: '65%',
    },
    series: [{
      type: 'radar',
      data: DATABASES.map((db, i) => ({
        name: db.name,
        value: METRICS.map((m) => m.values[i]),
        lineStyle: { color: db.color, width: 2 },
        itemStyle: { color: db.color },
        areaStyle: { color: `${db.color}18` },
      })),
    }],
  }), []);

  /* ── Grouped bar — normalized scores ─────────────────────────────── */
  const barOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f1f28',
      borderColor: '#3a3a4a',
      borderWidth: 1,
      textStyle: { color: '#f0f0f4', fontSize: 12 },
      formatter: (params) =>
        `<b>${params[0].axisValue}</b><br/>` +
        params.map((p) => `<span style="color:${p.color}">●</span> ${p.seriesName}: <b>${p.value}</b>`).join('<br/>'),
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#9090a4', fontSize: 10 },
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 16,
    },
    grid: { left: 100, right: 16, top: 8, bottom: 48 },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: '#7878a0', fontSize: 9 },
      splitLine: { lineStyle: { color: '#1f1f28', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: METRICS.map((m) => m.key),
      axisLabel: { color: '#9090a4', fontSize: 10 },
      axisLine: { lineStyle: { color: '#2c2c38' } },
      axisTick: { show: false },
    },
    series: DATABASES.map((db, i) => ({
      name: db.name,
      type: 'bar',
      data: METRICS.map((m) => m.values[i]),
      barGap: '5%',
      barWidth: 8,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: db.color,
        opacity: 0.85,
      },
    })),
  }), []);

  /* ── Timing heatmap (horizontal bars with raw ms) ──────────────── */
  const timingOption = useMemo(() => {
    const maxVals = TIMING.map((t) => Math.max(...t.values));
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1f1f28',
        borderColor: '#3a3a4a',
        borderWidth: 1,
        textStyle: { color: '#f0f0f4', fontSize: 12 },
        formatter: (params) =>
          `<b>${params[0].axisValue}</b><br/>` +
          params.map((p) => `<span style="color:${p.color}">●</span> ${p.seriesName}: <b>${p.value}ms</b>`).join('<br/>'),
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#9090a4', fontSize: 10 },
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 16,
      },
      grid: { left: 180, right: 16, top: 8, bottom: 40 },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#7878a0', fontSize: 9, formatter: '{value}ms' },
        splitLine: { lineStyle: { color: '#1f1f28', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: TIMING.map((t) => t.test),
        axisLabel: { color: '#9090a4', fontSize: 9, width: 160, overflow: 'truncate' },
        axisLine: { lineStyle: { color: '#2c2c38' } },
        axisTick: { show: false },
      },
      series: DATABASES.map((db, i) => ({
        name: db.name,
        type: 'bar',
        data: TIMING.map((t, ti) => ({
          value: t.values[i],
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: t.values[i] === Math.min(...t.values) ? db.color : `${db.color}55`,
          },
        })),
        barGap: '5%',
        barWidth: 8,
        label: {
          show: false,
        },
      })),
    };
  }, []);

  /* ── Overall score per DB ─────────────────────────────────────────── */
  const scores = DATABASES.map((db, i) => ({
    ...db,
    score: Math.round(METRICS.reduce((sum, m) => sum + m.values[i], 0) / METRICS.length),
  })).sort((a, b) => b.score - a.score);

  const fadeUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.18 } };

  return (
    <motion.div initial="initial" animate="animate" className="space-y-7">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="ff-page-header">
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}
          >
            <FaFlask size={13} />
          </div>
          <p className="ff-label">Research · Benchmark Lab</p>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.02em' }}>
          Database Benchmark Lab
        </h1>
        <p style={{ fontSize: 12, color: '#7878a0', marginTop: 4 }}>
          PostgreSQL vs MySQL vs MongoDB vs Oracle — performance, consistency & cost analysis for industrial ERP
        </p>
      </motion.div>

      {/* ── Overall scores ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {scores.map((db, idx) => (
          <div
            key={db.name}
            className="relative rounded-xl p-5 overflow-hidden"
            style={{
              background: idx === 0 ? `rgba(${db.color === '#6366f1' ? '99,102,241' : '16,185,129'},0.08)` : '#17171c',
              border: `1px solid ${idx === 0 ? db.color + '30' : '#1f1f28'}`,
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl" style={{ background: `linear-gradient(90deg, ${db.color}, ${db.tagColor})` }} />
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black"
                style={{ background: `${db.color}18`, color: db.color, border: `1px solid ${db.color}30` }}
              >
                {db.short}
              </div>
              {idx === 0 && (
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: `${db.color}20`, color: db.color, border: `1px solid ${db.color}35` }}>
                  Best Fit
                </span>
              )}
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f4', marginBottom: 2 }}>{db.name}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: db.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
              {db.score}
            </p>
            <p style={{ fontSize: 9, color: '#54546a', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Overall Score / 100
            </p>
          </div>
        ))}
      </motion.div>

      {/* ── Radar + Bar charts ──────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid lg:grid-cols-2 gap-5">

        {/* Radar */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Capability Radar</p>
            <p style={{ fontSize: 11, color: '#7878a0', marginTop: 2 }}>Multi-dimensional capability comparison</p>
          </div>
          <div className="p-5">
            <BaseChart option={radarOption} height="320px" />
          </div>
        </div>

        {/* Grouped bar */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Feature Score Breakdown</p>
            <p style={{ fontSize: 11, color: '#7878a0', marginTop: 2 }}>Normalized 0–100 performance scores per metric</p>
          </div>
          <div className="p-5">
            <BaseChart option={barOption} height="320px" />
          </div>
        </div>
      </motion.div>

      {/* ── Timing benchmark ────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Query Timing Benchmark</p>
              <p style={{ fontSize: 11, color: '#7878a0', marginTop: 2 }}>Response times in milliseconds — lower is better · highlighted bars = winner</p>
            </div>
            <span className="ff-badge ff-badge-violet">Lab Data</span>
          </div>
          <div className="p-5">
            <BaseChart option={timingOption} height="280px" />
          </div>
          {/* Raw timing table */}
          <div className="overflow-x-auto" style={{ borderTop: '1px solid #1f1f28' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#17171c', borderBottom: '1px solid #2c2c38' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600 }}>
                    Test Query
                  </th>
                  {DATABASES.map((db) => (
                    <th key={db.name} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: db.tagColor, fontWeight: 700 }}>
                      {db.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMING.map((t, i) => {
                  const minVal = Math.min(...t.values);
                  return (
                    <tr
                      key={i}
                      style={{ borderBottom: i < TIMING.length - 1 ? '1px solid #1f1f28' : 'none' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '10px 16px', color: '#9090a4' }}>{t.test}</td>
                      {t.values.map((v, di) => (
                        <td
                          key={di}
                          style={{
                            padding: '10px 16px',
                            textAlign: 'right',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontWeight: v === minVal ? 700 : 400,
                            color: v === minVal ? DATABASES[di].tagColor : '#7878a0',
                          }}
                        >
                          {v}ms {v === minVal && '⚡'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ── Recommendation card ──────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
              >
                <FaCheckCircle size={14} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Best-Fit Recommendation</p>
                <p style={{ fontSize: 11, color: '#7878a0', marginTop: 1 }}>
                  Optimized for: <strong style={{ color: '#818cf8' }}>{RECOMMENDATION.useCase}</strong>
                </p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
              >
                <FaDatabase size={14} style={{ color: '#818cf8' }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#818cf8' }}>{RECOMMENDATION.winner}</span>
              </div>
              <p style={{ fontSize: 13, color: '#7878a0' }}>
                recommended as primary DBMS for manufacturing ERP systems
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {RECOMMENDATION.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <FaCheckCircle size={12} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#9090a4', lineHeight: 1.6 }}>{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Cost vs performance matrix ───────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Cost vs Performance Matrix</p>
            <p style={{ fontSize: 11, color: '#7878a0', marginTop: 2 }}>Enterprise licensing & operational cost vs overall performance score</p>
          </div>
          <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { db: 'PostgreSQL', cost: 'Free / Open Source', perf: 94, costScore: 'Low',      highlight: true  },
              { db: 'MySQL',      cost: 'Free / GPL',          perf: 85, costScore: 'Low',      highlight: false },
              { db: 'MongoDB',    cost: '$57/GB (Atlas)',       perf: 76, costScore: 'Medium',   highlight: false },
              { db: 'Oracle',     cost: '$47,500/processor',   perf: 96, costScore: 'Very High', highlight: false },
            ].map(({ db, cost, perf, costScore, highlight }) => (
              <div
                key={db}
                className="rounded-xl p-4"
                style={{
                  background:  highlight ? 'rgba(99,102,241,0.08)' : 'rgba(0,0,0,0.15)',
                  border:      `1px solid ${highlight ? 'rgba(99,102,241,0.2)' : '#1f1f28'}`,
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 700, color: highlight ? '#818cf8' : '#f0f0f4', marginBottom: 8 }}>{db}</p>
                <div className="space-y-2">
                  <div>
                    <p style={{ fontSize: 9, color: '#54546a', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>Licensing Cost</p>
                    <p style={{ fontSize: 11, color: '#9090a4' }}>{cost}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: '#54546a', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>Cost Category</p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{
                        color: costScore === 'Low' ? '#10b981' : costScore === 'Medium' ? '#f59e0b' : '#f43f5e',
                        background: costScore === 'Low' ? 'rgba(16,185,129,0.1)' : costScore === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)',
                      }}
                    >
                      {costScore}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: '#54546a', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Performance</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: '#2c2c38' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${perf}%`,
                            background: highlight ? 'linear-gradient(90deg, #6366f1, #818cf8)' : 'linear-gradient(90deg, #3a3a4a, #5a5a7a)',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: highlight ? '#818cf8' : '#9090a4', fontFamily: 'JetBrains Mono, monospace' }}>{perf}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
