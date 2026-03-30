'use client';

import { useEffect, useState } from 'react';
import API from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBrain, FaCheckCircle, FaExclamationTriangle, FaLightbulb,
  FaUsers, FaSitemap, FaBoxes, FaChartBar, FaBug, FaBolt,
  FaSyncAlt, FaClock,
} from 'react-icons/fa';

/* ── Animation variants ─────────────────────────────────────────── */
const fadeUp  = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.18 } };
const stagger = { animate: { transition: { staggerChildren: 0.04 } } };

/* ── Metric card definitions ─────────────────────────────────────── */
const METRIC_DEFS = [
  { key: 'employeeCount',    label: 'Total Employees',      icon: FaUsers,    color: '#818cf8', bg: 'rgba(99,102,241,0.08)',   fmt: (v) => v?.toLocaleString() },
  { key: 'departmentCount',  label: 'Departments',          icon: FaSitemap,  color: '#a855f7', bg: 'rgba(168,85,247,0.08)',   fmt: (v) => v?.toLocaleString() },
  { key: 'productionRecords',label: 'Production Records',   icon: FaBoxes,    color: '#10b981', bg: 'rgba(16,185,129,0.08)',   fmt: (v) => v?.toLocaleString() },
  { key: 'totalUnits',       label: 'Total Units Produced', icon: FaChartBar, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   fmt: (v) => v?.toLocaleString() },
  { key: 'totalDefects',     label: 'Total Defects',        icon: FaBug,      color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',    fmt: (v) => v?.toLocaleString() },
  { key: 'efficiency',       label: 'Efficiency Rate',      icon: FaBolt,     color: '#14b8a6', bg: 'rgba(20,184,166,0.08)',   fmt: (v) => v != null ? `${v}%` : '—' },
];

/* ── Score colour band ───────────────────────────────────────────── */
function scoreColor(s) {
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  return '#f43f5e';
}
function scoreLabel(s) {
  if (s >= 80) return 'Excellent';
  if (s >= 60) return 'Moderate';
  return 'Critical';
}

/* ── SVG score ring ─────────────────────────────────────────────── */
function ScoreRing({ score }) {
  const r = 54, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={70} cy={70} r={r} fill="none" stroke="#1f1f28" strokeWidth={10} />
      <circle
        cx={70} cy={70} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 6px ${color}60)` }}
      />
    </svg>
  );
}

/* ── Metric card ─────────────────────────────────────────────────── */
function MetricCard({ def, value }) {
  const { label, icon: Icon, color, bg } = def;
  const display = value != null ? def.fmt(value) : '—';
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-xl p-4 flex items-start gap-4"
      style={{ background: '#17171c', border: '1px solid #1f1f28', transition: 'border-color 150ms' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2c2c38'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1f1f28'; }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#54546a', fontWeight: 600, marginBottom: 4 }}>
          {label}
        </p>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f4', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {display}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Section panel with numbered items ───────────────────────────── */
function SectionPanel({ title, items, icon: Icon, iconColor, iconBg, emptyMsg, accent }) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-xl overflow-hidden"
      style={{ background: '#17171c', border: '1px solid #1f1f28' }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg, color: iconColor }}>
            <Icon size={11} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>{title}</p>
        </div>
        {items?.length > 0 && (
          <span
            className="rounded-full px-2.5 py-0.5"
            style={{ fontSize: 10, fontWeight: 700, background: iconBg, color: iconColor, border: `1px solid ${iconColor}28` }}
          >
            {items.length}
          </span>
        )}
      </div>
      {items?.length > 0 ? (
        <ul>
          {items.map((item, i) => (
            <li
              key={i}
              className="px-5 py-3 flex items-start gap-3"
              style={{ borderBottom: i < items.length - 1 ? '1px solid #1f1f28' : 'none' }}
            >
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: iconBg, color: iconColor, fontSize: 9, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 12.5, color: '#9090a4', lineHeight: 1.65 }}>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-5 py-6 text-center" style={{ fontSize: 13, color: '#3a3a5a' }}>{emptyMsg}</div>
      )}
    </motion.div>
  );
}

/* ── Skeleton card ───────────────────────────────────────────────── */
function SkeletonCard({ height = 80 }) {
  return <div className="rounded-xl ff-skeleton" style={{ height }} />;
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function SystemSummary() {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error,       setError]       = useState('');

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/system-summary');
      setData(res.data);
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load system analysis. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const score   = data?.analysis?.overallScore ?? null;
  const metrics = data?.metrics ?? null;

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="ff-page-header">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.08)', color: '#a855f7' }}>
                <FaBrain size={13} />
              </div>
              <p className="ff-label">Administration · Intelligence</p>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.02em' }}>
              System Performance Intelligence
            </h1>
            <p style={{ fontSize: 12, color: '#54546a', marginTop: 4 }}>
              AI-driven evaluation of industrial performance with targeted improvement insights
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="ff-btn ff-btn-secondary"
              style={{ gap: 6 }}
            >
              {loading
                ? <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: '#818cf8', borderTopColor: 'transparent' }} />
                : <FaSyncAlt size={11} />
              }
              Refresh
            </button>
            {lastUpdated && !loading && (
              <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#3a3a5a' }}>
                <FaClock size={8} />
                <span>
                  Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Loading state ─────────────────────────────────────────── */}
      <AnimatePresence>
        {loading && !data && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="w-4 h-4 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin flex-shrink-0" />
              <p style={{ fontSize: 12, color: '#818cf8' }}>Generating intelligent system analysis…</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} height={82} />)}
            </div>
            <SkeletonCard height={220} />
            <div className="grid md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} height={180} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error state ───────────────────────────────────────────── */}
      {error && (
        <motion.div variants={fadeUp} className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)' }}>
          <FaExclamationTriangle size={13} style={{ color: '#f43f5e', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#f87191' }}>{error}</p>
        </motion.div>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      {data && (
        <>
          {/* ── Metric KPI Cards ─────────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <p className="ff-label mb-3">System Metrics Snapshot</p>
            <motion.div variants={stagger} animate="animate" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {METRIC_DEFS.map((def) => (
                <MetricCard key={def.key} def={def} value={metrics?.[def.key]} />
              ))}
            </motion.div>
          </motion.div>

          {/* ── AI Performance Score ──────────────────────────────── */}
          {score != null && (
            <motion.div variants={fadeUp}>
              <div
                className="rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6"
                style={{ background: '#17171c', border: '1px solid #1f1f28' }}
              >
                {/* Score ring */}
                <div className="relative flex items-center justify-center flex-shrink-0">
                  <ScoreRing score={score} />
                  <div className="absolute flex flex-col items-center">
                    <p style={{ fontSize: 28, fontWeight: 800, color: scoreColor(score), fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                      {score}
                    </p>
                    <p style={{ fontSize: 9, color: '#54546a', marginTop: 2 }}>/ 100</p>
                  </div>
                </div>

                {/* Score details */}
                <div className="flex-1">
                  <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#54546a', fontWeight: 600, marginBottom: 6 }}>
                    AI Performance Score
                  </p>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="rounded-full px-3 py-1"
                      style={{ background: `${scoreColor(score)}14`, border: `1px solid ${scoreColor(score)}30`, fontSize: 12, fontWeight: 700, color: scoreColor(score) }}
                    >
                      {scoreLabel(score)}
                    </div>
                    <p style={{ fontSize: 12, color: '#54546a' }}>
                      AI-evaluated system performance
                    </p>
                  </div>
                  {/* Score breakdown bars */}
                  {metrics && (
                    <div className="space-y-2">
                      {[
                        { label: 'Efficiency', value: Number(metrics.efficiency) || 0, max: 100, color: '#6366f1' },
                        { label: 'Quality (Defect-free %)', value: metrics.totalUnits > 0 ? Math.max(0, 100 - (metrics.totalDefects / metrics.totalUnits) * 100) : 0, max: 100, color: '#10b981' },
                        { label: 'Data Coverage', value: Math.min(100, (metrics.productionRecords || 0) / 5), max: 100, color: '#f59e0b' },
                      ].map(({ label, value, max, color }) => (
                        <div key={label}>
                          <div className="flex justify-between mb-1">
                            <span style={{ fontSize: 10, color: '#54546a' }}>{label}</span>
                            <span style={{ fontSize: 10, color: color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{Number(value).toFixed(1)}%</span>
                          </div>
                          <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: '#1f1f28' }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Analysis panels ───────────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <p className="ff-label mb-3">Detailed Analysis</p>
            <motion.div variants={stagger} animate="animate" className="grid md:grid-cols-3 gap-4">

              <SectionPanel
                title="System Strengths"
                items={data.analysis?.strengths}
                icon={FaCheckCircle}
                iconColor="#10b981"
                iconBg="rgba(16,185,129,0.08)"
                emptyMsg="No strengths recorded for this period."
              />

              <SectionPanel
                title="Risk Factors"
                items={data.analysis?.risks}
                icon={FaExclamationTriangle}
                iconColor="#f43f5e"
                iconBg="rgba(244,63,94,0.08)"
                emptyMsg="No risk factors detected."
              />

              <SectionPanel
                title="Strategic Recommendations"
                items={data.analysis?.recommendations}
                icon={FaLightbulb}
                iconColor="#f59e0b"
                iconBg="rgba(245,158,11,0.08)"
                emptyMsg="No recommendations available."
              />
            </motion.div>
          </motion.div>

          {/* ── Fallback raw text ─────────────────────────────────── */}
          {!data.analysis?.strengths && data.analysis && (
            <motion.div
              variants={fadeUp}
              className="rounded-xl p-5"
              style={{ background: '#17171c', border: '1px solid #1f1f28' }}
            >
              <p style={{ fontSize: 12, fontWeight: 600, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Analytical Interpretation
              </p>
              <p style={{ fontSize: 13, color: '#9090a4', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {data.analysis}
              </p>
            </motion.div>
          )}
        </>
      )}

      {/* ── Empty state ───────────────────────────────────────────── */}
      {!loading && !data && !error && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl p-12 flex flex-col items-center gap-4"
          style={{ background: '#17171c', border: '1px solid #1f1f28' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.08)' }}>
            <FaBrain size={20} style={{ color: '#a855f7' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f4' }}>No analysis available</p>
          <p style={{ fontSize: 12, color: '#54546a', textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
            Click Refresh to generate an AI-driven performance analysis of your system.
          </p>
          <button onClick={fetchSummary} className="ff-btn ff-btn-primary">Run Analysis</button>
        </motion.div>
      )}

    </motion.div>
  );
}
