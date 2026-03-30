'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import KPIStats from '@/components/charts/KPIStats';
import ProductionChart from '@/components/charts/ProductionChart';
import EmployeeTrendChart from '@/components/charts/EmployeeTrendChart';
import EfficiencyChart from '@/components/charts/EfficiencyChart';
import ErrorRateChart from '@/components/charts/ErrorRateChart';
import API from '@/lib/api';

import StorageIcon     from '@mui/icons-material/Storage';
import InsightsIcon    from '@mui/icons-material/Insights';
import TimelineIcon    from '@mui/icons-material/Timeline';
import SpeedIcon       from '@mui/icons-material/Speed';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SecurityIcon    from '@mui/icons-material/Security';

import { FaCircle, FaChartLine, FaDatabase, FaArrowRight, FaRobot, FaStar } from 'react-icons/fa';
import AICommandCenter from '@/components/ai/AICommandCenter';

/* ── Lazy-load heavy analytics sections ─────────────────────────── */
const SectionSkeleton = () => (
  <div className="rounded-xl ff-skeleton" style={{ height: 300 }} />
);

const FinancialImpactSection = dynamic(
  () => import('@/components/sections/FinancialImpactSection'),
  { ssr: false, loading: () => <SectionSkeleton /> }
);
const DeptPerformanceSection = dynamic(
  () => import('@/components/sections/DeptPerformanceSection'),
  { ssr: false, loading: () => <SectionSkeleton /> }
);

/* ── Constants ──────────────────────────────────────────────────── */
const fadeUp  = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.18 } };
const stagger = { animate: { transition: { staggerChildren: 0.04 } } };

const DBMS_FEATURES = [
  { Icon: StorageIcon,     color: '#818cf8', bg: 'rgba(99,102,241,0.08)',   label: 'Data Architecture', text: 'Centralized storage eliminates redundancy across all production lines.' },
  { Icon: AccountTreeIcon, color: '#a855f7', bg: 'rgba(168,85,247,0.08)',   label: 'Schema Design',     text: 'Relational schema enforces referential integrity across all entities.' },
  { Icon: TimelineIcon,    color: '#10b981', bg: 'rgba(16,185,129,0.08)',   label: 'Analytics',         text: 'Historical records enable performance trend analysis over time.' },
  { Icon: InsightsIcon,    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   label: 'Intelligence',      text: 'Automated KPI computation reduces decision latency significantly.' },
  { Icon: SpeedIcon,       color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',    label: 'Query Performance', text: 'Optimized queries enhance operational intelligence throughput.' },
  { Icon: SecurityIcon,    color: '#14b8a6', bg: 'rgba(20,184,166,0.08)',   label: 'Data Integrity',    text: 'ACID transactions ensure zero-loss consistency across all writes.' },
];

const FLOW_STEPS = [
  { step: '01', label: 'Data Input',              desc: 'Employee & production records captured via structured forms', color: '#818cf8' },
  { step: '02', label: 'Structured Storage',       desc: 'Relational PostgreSQL schema with FK constraints enforced',   color: '#a855f7' },
  { step: '03', label: 'Query Processing',         desc: 'JOIN-based aggregations power all KPI computations',         color: '#10b981' },
  { step: '04', label: 'Dashboard Intelligence',   desc: 'Real-time analytics surfaced to executive dashboards',       color: '#f59e0b' },
];

export default function Dashboard() {
  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [systemTime, setSystemTime] = useState('');
  const [showAICenter, setShowAICenter] = useState(false);

  useEffect(() => {
    API.get('/production')
      .then((res) => setRecords(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const tick = () => setSystemTime(
      new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const recordCount = records.length;
  const totalUnits  = useMemo(() => records.reduce((s, r) => s + (Number(r.units) || 0), 0), [records]);

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-7">

      {/* ── Page Header ──────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6"
        style={{ borderBottom: '1px solid #1f1f28' }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="ff-badge ff-badge-blue">
              <FaCircle size={5} className="animate-[pulseDot_2s_ease-in-out_infinite]" />
              Live Operations
            </span>
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4a4a6a', fontWeight: 600 }}>
              {recordCount} records indexed · {totalUnits.toLocaleString()} total units
            </span>
          </div>
          <h1
            className="text-[22px] font-semibold tracking-tight"
            style={{ color: '#f0f0f4', letterSpacing: '-0.02em' }}
          >
            Executive Command Center
          </h1>
          <p style={{ fontSize: 13, color: '#7878a0', maxWidth: 540, lineHeight: 1.6 }}>
            Industrial DBMS analytics platform — structured relational intelligence for manufacturing leadership.
          </p>
          
          {/* AI Command Center Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAICenter(true)}
            className="mt-3 ff-glass-hover rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
            style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center ff-pulse-glow"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <FaRobot size={16} color="white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: '#f0f0f4' }}>
                AI Intelligence Suite
              </p>
              <p className="text-xs" style={{ color: '#818cf8' }}>
                4 advanced AI features available
              </p>
            </div>
            <FaStar size={12} style={{ color: '#f59e0b', marginLeft: 'auto' }} />
          </motion.button>
        </div>

        <div
          className="sm:text-right flex-shrink-0 rounded-xl px-4 py-3"
          style={{ background: '#17171c', border: '1px solid #1f1f28' }}
        >
          <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4a4a6a', fontWeight: 600, marginBottom: 4 }}>
            System Clock
          </p>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#6366f1', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
            {systemTime}
          </p>
          <p style={{ fontSize: 10, color: '#4a4a6a', marginTop: 3 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* ── KPI Grid ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="ff-label">Performance Metrics</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f4', marginTop: 3, letterSpacing: '-0.01em' }}>
              Real-time KPI Overview
            </p>
          </div>
          <div className="flex items-center gap-2" style={{ fontSize: 10, color: '#7878a0' }}>
            <FaCircle size={5} style={{ color: '#10b981' }} className="animate-[pulseDot_2s_ease-in-out_infinite]" />
            <span>Auto-computed by DBMS</span>
          </div>
        </div>
        <KPIStats />
      </motion.div>

      {/* ── Operational Monitoring Charts ────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl overflow-hidden"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #1f1f28' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8' }}
            >
              <FaChartLine size={13} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.01em' }}>
                Operational Monitoring
              </p>
              <p style={{ fontSize: 11, color: '#7878a0', marginTop: 1 }}>
                KPI metrics derived from relational production records
              </p>
            </div>
          </div>
          <span className="ff-badge ff-badge-ghost hidden sm:inline-flex">4 Indicators</span>
        </div>
        <div className="p-5 grid md:grid-cols-2 gap-5">
          <ProductionChart records={records} />
          <EmployeeTrendChart records={records} />
          <EfficiencyChart records={records} />
          <ErrorRateChart records={records} />
        </div>
      </motion.div>

      {/* ── Section A: Financial Impact Analytics ────────────────── */}
      <motion.div variants={fadeUp}>
        <p className="ff-label mb-3">Section A · Financial Impact Analytics</p>
        <FinancialImpactSection records={records} />
      </motion.div>

      {/* ── Section B: Department Performance Matrix ─────────────── */}
      <motion.div variants={fadeUp}>
        <p className="ff-label mb-3">Section B · Department Performance Matrix</p>
        <DeptPerformanceSection records={records} />
      </motion.div>

      {/* ── DBMS Intelligence Pipeline ───────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl overflow-hidden"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.08)', color: '#a855f7' }}
          >
            <FaDatabase size={13} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.01em' }}>
              DBMS Intelligence Pipeline
            </p>
            <p style={{ fontSize: 11, color: '#7878a0', marginTop: 1 }}>
              How structured data transforms raw inputs into executive intelligence
            </p>
          </div>
        </div>

        {/* Flow arrows */}
        <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FLOW_STEPS.map((step, i) => (
            <div key={i} className="relative">
              {i < FLOW_STEPS.length - 1 && (
                <div className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-5 h-5 items-center justify-center">
                  <FaArrowRight size={9} style={{ color: '#3a3a5a' }} />
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="rounded-xl p-4"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1f1f28' }}
              >
                <span
                  className="inline-block text-[10px] font-black rounded-lg px-2 py-1 mb-3"
                  style={{ background: `${step.color}18`, color: step.color, border: `1px solid ${step.color}28` }}
                >
                  {step.step}
                </span>
                <p style={{ fontSize: 12, fontWeight: 700, color: step.color, marginBottom: 6 }}>{step.label}</p>
                <p style={{ fontSize: 11, color: '#7878a0', lineHeight: 1.6 }}>{step.desc}</p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Contribution grid */}
        <div className="px-5 pb-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DBMS_FEATURES.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="rounded-xl p-4 cursor-default"
              style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid #1f1f28', transition: 'border-color 150ms, background 150ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2c2c38'; e.currentTarget.style.background = 'rgba(0,0,0,0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1f1f28'; e.currentTarget.style.background = 'rgba(0,0,0,0.15)'; }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: feat.bg }}>
                <feat.Icon style={{ fontSize: 15, color: feat.color }} />
              </div>
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: feat.color, marginBottom: 5 }}>
                {feat.label}
              </p>
              <p style={{ fontSize: 12, color: '#7878a0', lineHeight: 1.6 }}>{feat.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Command Center Modal */}
      <AnimatePresence>
        {showAICenter && (
          <AICommandCenter onClose={() => setShowAICenter(false)} />
        )}
      </AnimatePresence>

    </motion.div>
  );
}
