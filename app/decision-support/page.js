'use client';

import { useEffect, useMemo, useState } from 'react';
import API from '@/lib/api';
import { motion } from 'framer-motion';
import {
  FaBalanceScale, FaChartLine, FaExclamationTriangle,
  FaCheckCircle, FaArrowUp, FaArrowDown, FaMinus,
} from 'react-icons/fa';
import AIInsightPanel from '@/components/ai/AIInsightPanel';

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
  // Remove markdown code fences (greedy so nested content is removed)
  s = s.replace(/```[\s\S]*?```/g, '').trim();
  // Iteratively strip JSON objects/arrays from innermost outward (handles nesting)
  let prev;
  do {
    prev = s;
    s = s.replace(/\{[^{}]*\}/g, '').replace(/\[[^\[\]]*\]/g, '').trim();
  } while (s !== prev);
  // Remove any leftover JSON punctuation fragments
  s = s.replace(/"[^"]+"\s*:\s*"[^"]*"/g, '').replace(/"[^"]+"\s*:\s*[\d.]+/g, '').trim();
  // Remove bare JSON-like lines (lines that are just commas, brackets, or quotes)
  s = s.split('\n').filter(line => !/^\s*[,\[\]{}"\d]+\s*$/.test(line)).join('\n');
  // Collapse multiple newlines/spaces
  s = s.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
  return s.length > 5 ? s : null;
}

/* ── AI insight text → structured UI cards ──────────────────────────── */
function AITextBlock({ text, color }) {
  if (!text) return null;
  // Split by newlines first, fallback to sentences
  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const points = rawLines.length > 1
    ? rawLines
    : (text.match(/[^.!?]+[.!?]+/g) || [text]).map(s => s.trim()).filter(Boolean);

  if (points.length === 1) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl px-4 py-3"
        style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 6 }} />
        <p style={{ fontSize: 12.5, color: '#9090a4', lineHeight: 1.8 }}>{points[0]}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {points.map((pt, i) => (
        <div key={i} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
          style={{ background: i % 2 === 0 ? `${color}06` : `${color}0a`, border: `1px solid ${color}16` }}>
          <div className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5"
            style={{ background: `${color}18`, fontSize: 9, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>
            {String(i + 1).padStart(2, '0')}
          </div>
          <p style={{ fontSize: 12.5, color: '#9090a4', lineHeight: 1.75 }}>{pt.replace(/^[-•▸]\s*/, '')}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Mini spark bars for trend chart ────────────────────────────── */
function SparkBars({ data }) {
  if (!data?.length) return null;
  const maxUnits = Math.max(...data.map(d => d.units || 0), 1);
  return (
    <div>
      <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600, marginBottom: 10 }}>
        Monthly Output — {data.length} months
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 56 }}>
        {data.map((row, i) => {
          const h   = Math.max(4, Math.round((row.units / maxUnits) * 52));
          const eff = row.units > 0 ? ((row.units - row.defects) / row.units * 100) : 100;
          const col = eff >= 92 ? '#10b981' : eff >= 80 ? '#818cf8' : eff >= 70 ? '#f59e0b' : '#f43f5e';
          const isLast = i === data.length - 1;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div title={`${row.month}: ${row.units?.toLocaleString()} units, ${eff.toFixed(1)}% eff`}
                style={{
                  width: '100%', height: h, borderRadius: '3px 3px 0 0',
                  background: col,
                  opacity: isLast ? 1 : 0.55,
                  border: isLast ? `1px solid ${col}` : 'none',
                  boxShadow: isLast ? `0 0 8px ${col}60` : 'none',
                  cursor: 'default',
                  transition: 'opacity 0.2s',
                }}
              />
              {data.length <= 8 && (
                <span style={{ fontSize: 8, color: '#3a3a5a', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                  {row.month?.slice(0, 3)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* Predicted next bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1', opacity: 0.8 }} />
        <span style={{ fontSize: 10, color: '#54546a' }}>Historical output — brighter = next period forecast</span>
      </div>
    </div>
  );
}

/* ── Confidence arc ──────────────────────────────────────────────── */
function ConfidenceArc({ value }) {
  const r = 28, cx = 36, cy = 36, stroke = 7;
  const circumference = Math.PI * r; // half circle
  const offset = circumference - (value / 100) * circumference;
  const col = value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#f43f5e';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="72" height="44" viewBox="0 0 72 44" style={{ overflow: 'visible' }}>
        {/* Track */}
        <path d={`M ${stroke/2} 36 A ${r} ${r} 0 0 1 ${72 - stroke/2} 36`}
          fill="none" stroke="#1f1f28" strokeWidth={stroke} strokeLinecap="round" />
        {/* Fill */}
        <path d={`M ${stroke/2} 36 A ${r} ${r} 0 0 1 ${72 - stroke/2} 36`}
          fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 4px ${col}80)` }} />
        <text x="36" y="32" textAnchor="middle" fill={col}
          style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
          {value}%
        </text>
      </svg>
      <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600, marginTop: -4 }}>Confidence</p>
    </div>
  );
}

/* ── Prediction card ─────────────────────────────────────────────── */
function PredictionContent({ data }) {
  const { prediction, monthlyTrend, dataPoints } = data;

  if (!prediction || typeof prediction !== 'object') {
    return <p style={{ fontSize: 12, color: '#54546a' }}>No prediction data available.</p>;
  }

  const trendRaw   = safeStr(prediction.trend) ?? 'stable';
  const trendColor = trendRaw === 'increasing' ? '#10b981' : trendRaw === 'declining' ? '#f43f5e' : '#f59e0b';
  const TrendIcon  = trendRaw === 'increasing' ? FaArrowUp : trendRaw === 'declining' ? FaArrowDown : FaMinus;
  const confidence = prediction.confidence != null ? Number(prediction.confidence) : null;
  const reasoning  = safeStr(prediction.reasoning) || safeStr(prediction.analysis) || safeStr(prediction.summary);

  const predStats = [
    {
      label: 'Predicted Units',
      value: prediction.predictedUnits != null ? Number(prediction.predictedUnits).toLocaleString() : null,
      sub: 'next period output',
      color: '#818cf8', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.18)',
    },
    {
      label: 'Predicted Defects',
      value: prediction.predictedDefects != null ? Number(prediction.predictedDefects).toLocaleString() : null,
      sub: 'expected defective units',
      color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.18)',
    },
    {
      label: 'Predicted Efficiency',
      value: prediction.predictedEfficiency != null ? `${prediction.predictedEfficiency}%` : null,
      sub: 'forecast quality score',
      color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.18)',
    },
  ].filter(s => s.value != null);

  return (
    <div className="space-y-5">

      {/* ── Header row: trend badge + confidence + records ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-full px-4 py-2"
            style={{ background: `${trendColor}12`, border: `1px solid ${trendColor}30` }}>
            <TrendIcon size={10} style={{ color: trendColor }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: trendColor, textTransform: 'capitalize' }}>
              {trendRaw} trend
            </span>
          </div>
          {dataPoints != null && (
            <span className="rounded-full px-3 py-1.5" style={{ fontSize: 10, color: '#54546a', background: 'rgba(0,0,0,0.2)', border: '1px solid #1f1f28' }}>
              {dataPoints} records analysed
            </span>
          )}
        </div>
        {confidence != null && <ConfidenceArc value={confidence} />}
      </div>

      {/* ── Big predicted stat cards ── */}
      {predStats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {predStats.map((s) => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#54546a', fontWeight: 600, marginBottom: 6 }}>{s.label}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 10, color: '#3a3a5a', marginTop: 5 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── AI Reasoning ── */}
      {reasoning && (
        <div className="rounded-xl px-4 py-4" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.14)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div style={{ width: 3, height: 14, borderRadius: 2, background: '#6366f1' }} />
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6366f1', fontWeight: 700 }}>AI Reasoning</p>
          </div>
          <AITextBlock text={reasoning} color="#6366f1" />
        </div>
      )}

      {/* ── Spark bar chart + table ── */}
      {monthlyTrend?.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid #1f1f28' }}>
          <SparkBars data={monthlyTrend} />
          <div className="overflow-x-auto mt-4 rounded-lg" style={{ border: '1px solid #1f1f28' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#0c0c0f', borderBottom: '1px solid #2c2c38' }}>
                  {['Month', 'Units', 'Defects', 'Efficiency'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Month' ? 'left' : 'right', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((row, i) => {
                  const eff = row.units > 0 ? (((row.units - row.defects) / row.units) * 100).toFixed(1) : '—';
                  const effN = parseFloat(eff);
                  const effColor = isNaN(effN) ? '#54546a' : effN >= 95 ? '#10b981' : effN >= 85 ? '#f59e0b' : '#f43f5e';
                  const isLatest = i === monthlyTrend.length - 1;
                  return (
                    <tr key={i} style={{ borderBottom: i < monthlyTrend.length - 1 ? '1px solid #1f1f28' : 'none', background: isLatest ? 'rgba(99,102,241,0.04)' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', color: isLatest ? '#818cf8' : '#9090a4', fontFamily: 'JetBrains Mono, monospace', fontWeight: isLatest ? 600 : 400 }}>
                        {row.month}{isLatest ? ' ←' : ''}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#f0f0f4', fontFamily: 'JetBrains Mono, monospace' }}>{row.units?.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: row.defects > 0 ? '#f43f5e' : '#54546a', fontFamily: 'JetBrains Mono, monospace' }}>{row.defects}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: effColor, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                        {eff}{eff !== '—' ? '%' : ''}
                      </td>
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

/* ── Risk level segmented gauge ──────────────────────────────────── */
function RiskGauge({ level }) {
  const levels  = ['low', 'medium', 'high', 'critical'];
  const colors  = ['#10b981', '#f59e0b', '#f97316', '#f43f5e'];
  const labels  = ['Low', 'Medium', 'High', 'Critical'];
  const active  = levels.indexOf((level ?? '').toLowerCase());
  return (
    <div>
      <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600, marginBottom: 8 }}>Risk Level</p>
      <div style={{ display: 'flex', gap: 4 }}>
        {levels.map((l, i) => {
          const isActive = i === active;
          const isPast   = i < active;
          return (
            <div key={l} style={{ flex: 1 }}>
              <div style={{
                height: 8, borderRadius: 4,
                background: isActive ? colors[i] : isPast ? `${colors[i]}55` : '#1f1f28',
                boxShadow: isActive ? `0 0 10px ${colors[i]}70` : 'none',
                transition: 'all 0.4s ease',
              }} />
              <p style={{ fontSize: 8, marginTop: 4, textAlign: 'center', color: isActive ? colors[i] : '#3a3a5a', fontWeight: isActive ? 700 : 400 }}>
                {labels[i]}
              </p>
            </div>
          );
        })}
      </div>
      {active >= 0 && (
        <div className="mt-2 rounded-lg px-3 py-2 text-center" style={{ background: `${colors[active]}10`, border: `1px solid ${colors[active]}28` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: colors[active], textTransform: 'capitalize' }}>
            {labels[active]} Risk
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Severity distribution bar ───────────────────────────────────── */
function SeverityBar({ anomalies }) {
  const high   = anomalies.filter(a => a.severity === 'high').length;
  const medium = anomalies.filter(a => a.severity === 'medium').length;
  const low    = anomalies.filter(a => a.severity === 'low').length;
  const total  = anomalies.length || 1;
  if (!anomalies.length) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', fontWeight: 600 }}>Severity Distribution</p>
        <span style={{ fontSize: 10, color: '#54546a' }}>{anomalies.length} total</span>
      </div>
      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: 1 }}>
        {high   > 0 && <div style={{ flex: high,   background: '#f43f5e', borderRadius: '5px 0 0 5px' }} title={`${high} high`} />}
        {medium > 0 && <div style={{ flex: medium, background: '#f59e0b' }} title={`${medium} medium`} />}
        {low    > 0 && <div style={{ flex: low,    background: '#10b981', borderRadius: '0 5px 5px 0' }} title={`${low} low`} />}
      </div>
      <div className="flex gap-4 mt-2">
        {[['#f43f5e','High', high],['#f59e0b','Medium', medium],['#10b981','Low', low]].map(([c,l,n]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
            <span style={{ fontSize: 10, color: '#54546a' }}>{l}: <strong style={{ color: '#9090a4' }}>{n}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Anomaly content ─────────────────────────────────────────────── */
function AnomalyContent({ data }) {
  const { anomalies = [], riskLevel, summary, baseline } = data;
  const summaryText = safeStr(summary);

  return (
    <div className="space-y-5">

      {/* ── Top row: Risk gauge + baseline stats ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Risk gauge */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid #1f1f28' }}>
          <RiskGauge level={riskLevel} />
        </div>

        {/* Baseline stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Avg Defect Rate', value: baseline?.avgDefectRate != null ? `${baseline.avgDefectRate}%` : '—', color: '#f43f5e' },
            { label: 'Std Deviation',   value: baseline?.stdDeviation  != null ? `±${baseline.stdDeviation}%` : '—', color: '#f59e0b' },
            { label: 'Records',         value: baseline?.recordsAnalysed ?? '—', color: '#818cf8' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1f1f28' }}>
              <p style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#54546a', fontWeight: 600, marginBottom: 6 }}>{s.label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Severity distribution ── */}
      {anomalies.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid #1f1f28' }}>
          <SeverityBar anomalies={anomalies} />
        </div>
      )}

      {/* ── Analysis summary ── */}
      {summaryText && (
        <div className="rounded-xl px-4 py-4" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.14)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div style={{ width: 3, height: 14, borderRadius: 2, background: '#f59e0b' }} />
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f59e0b', fontWeight: 700 }}>Analysis Summary</p>
          </div>
          <AITextBlock text={summaryText} color="#f59e0b" />
        </div>
      )}

      {/* ── Anomaly timeline ── */}
      {anomalies.length > 0 ? (
        <div>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#54546a', fontWeight: 600, marginBottom: 10 }}>
            Detected Anomalies — {anomalies.length} event{anomalies.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2" style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, background: '#1f1f28', borderRadius: 2 }} />

            {anomalies.map((a, i) => {
              const sev      = (a.severity ?? 'low').toLowerCase();
              const sevColor = sev === 'high' ? '#f43f5e' : sev === 'medium' ? '#f59e0b' : '#10b981';
              const typeColor= a.type === 'spike' ? '#f43f5e' : a.type === 'drop' ? '#818cf8' : '#f59e0b';
              const detail   = safeStr(a.detail) || safeStr(a.description) || safeStr(a.reason) || 'Anomaly detected in production data';
              const dateStr  = safeStr(a.date) || safeStr(a.timestamp) || '';
              return (
                <div key={i} className="flex gap-3" style={{ position: 'relative' }}>
                  {/* Timeline dot */}
                  <div style={{ flexShrink: 0, width: 24, display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: sevColor, boxShadow: `0 0 6px ${sevColor}80`, border: `2px solid #17171c`, flexShrink: 0 }} />
                  </div>
                  {/* Card */}
                  <div className="flex-1 rounded-xl p-3 mb-0.5" style={{ background: 'rgba(0,0,0,0.18)', border: `1px solid ${sevColor}20` }}>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="rounded-md px-2 py-0.5" style={{ fontSize: 9, fontWeight: 700, background: `${sevColor}18`, color: sevColor, letterSpacing: '0.06em' }}>
                        {sev.toUpperCase()}
                      </span>
                      {a.type && (
                        <span className="rounded-md px-2 py-0.5" style={{ fontSize: 9, fontWeight: 600, background: `${typeColor}12`, color: typeColor, letterSpacing: '0.05em', textTransform: 'capitalize' }}>
                          {a.type}
                        </span>
                      )}
                      {dateStr && (
                        <span style={{ fontSize: 10, color: '#54546a', fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto' }}>{dateStr}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12.5, color: '#9090a4', lineHeight: 1.65 }}>{detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
          <FaCheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>All Clear</p>
            <p style={{ fontSize: 12, color: '#54546a', marginTop: 2 }}>No anomalies detected in the analysis window. Production quality is stable.</p>
          </div>
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
