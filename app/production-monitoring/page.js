'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import API from '@/lib/api';
import SystemStatusBadge from '@/components/production/SystemStatusBadge';
import { generateProductionInsights } from '@/lib/analytics/productionEngine';
import { Storage, Insights, Speed, Timeline } from '@mui/icons-material';
import { FaCircle, FaChartLine } from 'react-icons/fa';

const METRIC_THEMES = {
  emerald: { accent: '#10b981', bg: 'rgba(16,185,129,0.08)', iconColor: '#10b981' },
  red:     { accent: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  iconColor: '#f43f5e' },
  blue:    { accent: '#6366f1', bg: 'rgba(99,102,241,0.08)', iconColor: '#818cf8' },
};

function MetricCard({ icon, title, value, accent }) {
  const th = METRIC_THEMES[accent] ?? METRIC_THEMES.blue;
  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        background: '#17171c',
        border: `1px solid #1f1f28`,
        borderLeft: `2px solid ${th.accent}`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }} />
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: th.bg, color: th.iconColor }}>
          {icon}
        </div>
        <p style={{ fontSize: 11, color: '#54546a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title}
        </p>
      </div>
      <p style={{ fontSize: 26, fontWeight: 600, color: '#f0f0f4', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

function ImpactItem({ icon, title, desc }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-0.5" style={{ color: '#54546a' }}>{icon}</div>
      <div>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4', marginBottom: 4 }}>{title}</h4>
        <p style={{ fontSize: 12, color: '#54546a', lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

export default function ProductionMonitoring() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/production')
      .then((res) => setRecords(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const insights = useMemo(() => generateProductionInsights(records), [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#6366f1] border-t-transparent animate-spin mx-auto mb-4" />
          <p style={{ fontSize: 13, color: '#54546a' }}>Loading production intelligence...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex items-center justify-center py-32">
        <p style={{ fontSize: 13, color: '#54546a' }}>No production records found. Add records to begin monitoring.</p>
      </div>
    );
  }

  const { totalUnits, totalDefects, stability, forecast, status } = insights;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Page Header */}
      <div className="ff-page-header">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8' }}
              >
                <FaChartLine size={13} />
              </div>
              <p className="ff-label">Analytics · Live Monitoring</p>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.02em' }}>
              Production Intelligence Console
            </h1>
            <p style={{ fontSize: 12, color: '#54546a', marginTop: 4 }}>
              Real-time operational analytics derived from centralized relational DBMS
            </p>
          </div>
          <SystemStatusBadge status={status} />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <MetricCard icon={<Storage fontSize="small" />} title="Total Production Units" value={totalUnits.toLocaleString()} accent="emerald" />
        <MetricCard icon={<Insights fontSize="small" />} title="Total Defective Units" value={totalDefects.toLocaleString()} accent="red" />
        <MetricCard icon={<Speed fontSize="small" />} title="Operational Stability" value={`${stability}%`} accent="blue" />
      </div>

      {/* Forecast Banner */}
      {forecast > 0 && (
        <div
          className="rounded-xl p-5 flex items-center gap-4"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}
        >
          <FaCircle size={7} style={{ color: '#818cf8', flexShrink: 0 }} />
          <div>
            <p className="ff-label mb-1">Predictive Production Forecast</p>
            <p style={{ fontSize: 13, color: '#9090a4', lineHeight: 1.6 }}>
              Based on structured time-series modeling, projected short-term output is approximately{' '}
              <strong style={{ color: '#818cf8', fontFamily: 'JetBrains Mono, monospace' }}>
                {forecast.toLocaleString()}
              </strong>{' '}
              units.
            </p>
          </div>
        </div>
      )}

      {/* DBMS Impact Panel */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>DBMS Impact on Industrial Monitoring</p>
          <p style={{ fontSize: 11, color: '#54546a', marginTop: 2 }}>How structured databases enhance real-time manufacturing intelligence</p>
        </div>
        <div className="p-5 grid md:grid-cols-2 gap-6">
          <ImpactItem icon={<Timeline fontSize="small" />} title="Structured Time-Series Intelligence" desc="Indexed productionDate fields enable fast chronological aggregation." />
          <ImpactItem icon={<Storage fontSize="small" />} title="Referential Data Integrity" desc="Relational links eliminate redundancy and preserve data accuracy." />
          <ImpactItem icon={<Insights fontSize="small" />} title="Automated KPI Computation" desc="Aggregations derived from DB queries remove spreadsheet dependency." />
          <ImpactItem icon={<Speed fontSize="small" />} title="Operational Decision Acceleration" desc="Query-driven analytics improve industrial response time significantly." />
        </div>
      </div>

    </motion.div>
  );
}
