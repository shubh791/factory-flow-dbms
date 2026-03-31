'use client';

import { useEffect, useMemo, useState } from 'react';
import API from '@/lib/api';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  FaBalanceScale, FaChartLine, FaExclamationTriangle,
  FaCheckCircle, FaLightbulb, FaArrowUp, FaArrowDown, FaMinus,
} from 'react-icons/fa';
import AIInsightPanel from '@/components/ai/AIInsightPanel';

const AskAIChat = dynamic(() => import('@/components/ai/AskAIChat'), { ssr: false });

const stagger = { animate: { transition: { staggerChildren: 0.04 } } };
const fadeUp  = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

/* ── Pillar bar ───────────────────────────────────────────────────── */
function PillarBar({ title, value, color }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span style={{ fontSize: 13, color: '#9090a4', fontWeight: 500 }}>{title}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: '#1f1f28' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)`,
            borderRadius: 9999,
          }}
        />
      </div>
    </div>
  );
}

/* ── Safe text — strips all embedded JSON, code fences, raw objects ─ */
function safeStr(val) {
  if (val == null) return null;
  if (typeof val === 'object') return null;
  let s = String(val).trim();
  // Remove markdown code fences
  s = s.replace(/```[\s\S]*?```/g, '').trim();
  // Remove entire JSON object/array blocks (including multiline)
  s = s.replace(/\{[\s\S]*?\}/g, '').replace(/\[[\s\S]*?\]/g, '').trim();
  // Remove any leftover key-value fragments like "key": "value"
  s = s.replace(/"[^"]+"\s*:\s*"[^"]*"/g, '').replace(/"[^"]+"\s*:\s*[\d.]+/g, '').trim();
  // Collapse multiple newlines/spaces
  s = s.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
  return s.length > 5 ? s : null;
}

/* ── Prediction card ─────────────────────────────────────────────── */
function PredictionContent({ data }) {
  const { prediction, monthlyTrend, dataPoints } = data;

  if (!prediction || typeof prediction !== 'object') {
    return <p style={{ fontSize: 12, color: '#54546a' }}>No prediction data available.</p>;
  }

  const trendRaw  = safeStr(prediction.trend) ?? 'stable';
  const trendColor = trendRaw === 'increasing' ? '#10b981' : trendRaw === 'declining' ? '#f43f5e' : '#f59e0b';
  const TrendIcon  = trendRaw === 'increasing' ? FaArrowUp : trendRaw === 'declining' ? FaArrowDown : FaMinus;

  const stats = [
    { label: 'Predicted Units',      value: prediction.predictedUnits != null ? Number(prediction.predictedUnits).toLocaleString() : null, color: '#818cf8' },
    { label: 'Predicted Defects',    value: prediction.predictedDefects != null ? Number(prediction.predictedDefects).toLocaleString() : null, color: '#f43f5e' },
    { label: 'Predicted Efficiency', value: prediction.predictedEfficiency != null ? `${prediction.predictedEfficiency}%` : null, color: '#10b981' },
  ].filter(s => s.value != null);

  const reasoning = safeStr(prediction.reasoning) || safeStr(prediction.analysis) || safeStr(prediction.summary);

  return (
    <div className="space-y-4">
      {/* Trend + confidence badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: `${trendColor}14`, border: `1px solid ${trendColor}28` }}>
          <TrendIcon size={9} style={{ color: trendColor }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: trendColor, textTransform: 'capitalize' }}>
            {trendRaw} trend
          </span>
        </div>
        {prediction.confidence != null && (
          <div className="rounded-full px-3 py-1.5" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}>
            <span style={{ fontSize: 11, color: '#818cf8' }}>Confidence: {prediction.confidence}%</span>
          </div>
        )}
        {dataPoints != null && (
          <span style={{ fontSize: 10, color: '#3a3a5a' }}>{dataPoints} records analysed</span>
        )}
      </div>

      {/* Predicted stats grid */}
      {stats.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1f1f28' }}>
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#54546a', fontWeight: 600, marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* AI reasoning text */}
      {reasoning && (
        <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6366f1', fontWeight: 600, marginBottom: 6 }}>AI Reasoning</p>
          <p style={{ fontSize: 12.5, color: '#9090a4', lineHeight: 1.75 }}>{reasoning}</p>
        </div>
      )}

      {/* Monthly trend mini-table */}
      {monthlyTrend?.length > 0 && (
        <div>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600, marginBottom: 8 }}>
            Historical Trend ({monthlyTrend.length} months)
          </p>
          <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #1f1f28' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#0c0c0f', borderBottom: '1px solid #2c2c38' }}>
                  {['Month', 'Units', 'Defects', 'Efficiency'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: h === 'Month' ? 'left' : 'right', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((row, i) => {
                  const eff = row.units > 0 ? (((row.units - row.defects) / row.units) * 100).toFixed(1) : '—';
                  const effColor = row.units > 0 ? (parseFloat(eff) >= 95 ? '#10b981' : parseFloat(eff) >= 85 ? '#f59e0b' : '#f43f5e') : '#54546a';
                  return (
                    <tr key={i} style={{ borderBottom: i < monthlyTrend.length - 1 ? '1px solid #1f1f28' : 'none' }}>
                      <td style={{ padding: '7px 12px', color: '#9090a4', fontFamily: 'JetBrains Mono, monospace' }}>{row.month}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', color: '#f0f0f4', fontFamily: 'JetBrains Mono, monospace' }}>{row.units?.toLocaleString()}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', color: row.defects > 0 ? '#f43f5e' : '#54546a', fontFamily: 'JetBrains Mono, monospace' }}>{row.defects}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', color: effColor, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{eff}{eff !== '—' ? '%' : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Anomaly content ─────────────────────────────────────────────── */
function AnomalyContent({ data }) {
  const { anomalies = [], riskLevel, summary, baseline } = data;

  const riskColor = {
    low:      '#10b981',
    medium:   '#f59e0b',
    high:     '#f97316',
    critical: '#f43f5e',
  }[riskLevel?.toLowerCase()] ?? '#9090a4';

  const summaryText = safeStr(summary);

  return (
    <div className="space-y-4">
      {/* Risk level + baseline stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl p-3 text-center col-span-2 sm:col-span-1" style={{ background: `${riskColor}0d`, border: `1px solid ${riskColor}28` }}>
          <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600, marginBottom: 4 }}>Risk Level</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: riskColor, textTransform: 'capitalize' }}>{riskLevel ?? 'Unknown'}</p>
        </div>
        {baseline && (
          <>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1f1f28' }}>
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600, marginBottom: 4 }}>Avg Defect Rate</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#f43f5e', fontFamily: 'JetBrains Mono, monospace' }}>{baseline.avgDefectRate}%</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1f1f28' }}>
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600, marginBottom: 4 }}>Std Deviation</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>±{baseline.stdDeviation}%</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1f1f28' }}>
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600, marginBottom: 4 }}>Records</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#818cf8', fontFamily: 'JetBrains Mono, monospace' }}>{baseline.recordsAnalysed}</p>
            </div>
          </>
        )}
      </div>

      {/* Summary */}
      {summaryText && (
        <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1f1f28' }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600, marginBottom: 6 }}>Analysis Summary</p>
          <p style={{ fontSize: 12.5, color: '#9090a4', lineHeight: 1.75 }}>{summaryText}</p>
        </div>
      )}

      {/* Anomalies list */}
      {anomalies.length > 0 ? (
        <div className="space-y-2">
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#54546a', fontWeight: 600 }}>
            Detected Anomalies — {anomalies.length} found
          </p>
          {anomalies.map((a, i) => {
            const sevColor = a.severity === 'high' ? '#f43f5e' : a.severity === 'medium' ? '#f59e0b' : '#10b981';
            const detail   = safeStr(a.detail) || safeStr(a.description) || safeStr(a.reason) || 'Anomaly detected';
            const dateStr  = safeStr(a.date) || safeStr(a.timestamp) || '';
            return (
              <div key={i} className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.15)', border: `1px solid ${sevColor}20` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="rounded px-2 py-0.5 flex-shrink-0" style={{ fontSize: 9, fontWeight: 700, background: `${sevColor}18`, color: sevColor, letterSpacing: '0.06em' }}>
                    {a.severity?.toUpperCase() ?? 'ANOMALY'}
                  </span>
                  {dateStr && (
                    <span style={{ fontSize: 10, color: '#54546a', fontFamily: 'JetBrains Mono, monospace' }}>{dateStr}</span>
                  )}
                </div>
                <p style={{ fontSize: 12.5, color: '#9090a4', lineHeight: 1.65 }}>{detail}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg px-4 py-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <FaCheckCircle size={11} style={{ color: '#10b981' }} />
          <span style={{ fontSize: 12.5, color: '#10b981' }}>No anomalies detected in the analysis window.</span>
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function DecisionSupport() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    API.get('/system-summary')
      .then((res) => setMetrics(res.data.metrics))
      .catch(console.error);
  }, []);

  const calculated = useMemo(() => {
    if (!metrics) return null;
    const totalUnits   = metrics.totalUnits   || 0;
    const totalDefects = metrics.totalDefects || 0;
    const effScore     = Number(metrics.efficiency) || 0;
    const qualScore    = totalUnits > 0 ? 100 - (totalDefects / totalUnits) * 100 : 0;
    const workScore    = metrics.employeeCount > 0 ? 85 : 60;
    const finScore     = totalUnits > 0 ? 90 : 70;
    const IPI          = effScore * 0.3 + qualScore * 0.25 + workScore * 0.2 + finScore * 0.25;
    return { effScore, qualScore, workScore, finScore, IPI: Number(IPI.toFixed(0)) };
  }, [metrics]);

  if (!calculated) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-7 h-7 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin" />
      </div>
    );
  }

  const { effScore, qualScore, workScore, finScore, IPI } = calculated;

  const statusCfg =
    IPI >= 85 ? { label: 'Optimized Operations', color: '#10b981', bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.2)',  stroke: '#10b981' }
    : IPI >= 70 ? { label: 'Moderate Risk Zone',  color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.2)',  stroke: '#e8960a' }
    :             { label: 'Operational Risk',     color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',    border: 'rgba(244,63,94,0.2)',   stroke: '#f43f5e' };

  const radius       = 80;
  const circumference = 2 * Math.PI * radius;
  const offset       = circumference - (IPI / 100) * circumference;

  const pillars = [
    { title: 'Operational Efficiency', value: effScore,  color: '#10b981' },
    { title: 'Quality Control',        value: qualScore, color: '#818cf8' },
    { title: 'Workforce Stability',    value: workScore, color: '#a855f7' },
    { title: 'Financial Strength',     value: finScore,  color: '#fbbf24' },
  ];

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">

      {/* Page Header */}
      <motion.div variants={fadeUp} className="ff-page-header">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.08)', color: '#a855f7' }}>
            <FaBalanceScale size={13} />
          </div>
          <p className="ff-label">Analytics · Decision Intelligence</p>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.02em' }}>
          Industrial Decision Intelligence
        </h1>
        <p style={{ fontSize: 12, color: '#54546a', marginTop: 4 }}>
          IPI · AI predictions · anomaly detection · executive Q&A
        </p>
      </motion.div>

      {/* ── Executive AI Assistant — TOP ─────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <p className="ff-label mb-3">Executive AI Assistant</p>
        <AskAIChat defaultOpen large />
      </motion.div>

      {/* IPI Gauge + Pillars */}
      <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-5">

        {/* Gauge */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-6">
            <div className="relative flex-shrink-0">
              <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="90" cy="90" r={radius} stroke="#1f1f28" strokeWidth="14" fill="transparent" />
                <circle cx="90" cy="90" r={radius}
                  stroke={statusCfg.stroke} strokeWidth="14" fill="transparent"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 6px ${statusCfg.stroke}60)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p style={{ fontSize: 32, fontWeight: 700, color: '#f0f0f4', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{IPI}</p>
                <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#54546a', marginTop: 4 }}>IPI Score</p>
              </div>
            </div>
            <div className="space-y-3 text-center md:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
                {statusCfg.label}
              </span>
              <p style={{ fontSize: 12, color: '#9090a4', lineHeight: 1.7, maxWidth: 240 }}>
                Composite of efficiency, quality, workforce stability, and financial resilience. Derived from live DBMS aggregation.
              </p>
            </div>
          </div>
        </div>

        {/* Pillars */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Strategic Pillar Contribution</p>
            <p style={{ fontSize: 11, color: '#54546a', marginTop: 2 }}>Weighted breakdown by performance dimension</p>
          </div>
          <div className="p-5 space-y-5">
            {pillars.map((p, i) => <PillarBar key={i} {...p} />)}
          </div>
        </div>
      </motion.div>

      {/* AI Production Prediction */}
      <motion.div variants={fadeUp}>
        <p className="ff-label mb-3">AI Predictions · Next Period Forecast</p>
        <AIInsightPanel
          title="Production Forecast"
          subtitle="AI-predicted next month output · Based on historical trend analysis"
          endpoint="/ai/predict"
          cacheKey="ai-predict"
          icon={<FaChartLine size={13} />}
          color="#6366f1"
          autoFetch
          renderContent={(data) => <PredictionContent data={data} />}
        />
      </motion.div>

      {/* AI Anomaly Detection */}
      <motion.div variants={fadeUp}>
        <p className="ff-label mb-3">AI Anomaly Detection · Last 60 Days</p>
        <AIInsightPanel
          title="Production Anomaly Scanner"
          subtitle="Statistical + AI-driven defect spike and quality drift detection"
          endpoint="/ai/anomaly"
          cacheKey="ai-anomaly"
          icon={<FaExclamationTriangle size={13} />}
          color="#f59e0b"
          autoFetch
          renderContent={(data) => <AnomalyContent data={data} />}
        />
      </motion.div>

    </motion.div>
  );
}
