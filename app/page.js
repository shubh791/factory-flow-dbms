'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  FaIndustry, FaUsers, FaTachometerAlt, FaExclamationTriangle,
  FaArrowRight, FaArrowUp, FaArrowDown, FaMinus,
  FaCalendarDay, FaMoneyBillWave,
  FaRobot, FaCog, FaShieldAlt, FaChartBar,
} from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { useFactoryData } from '@/lib/hooks/useFactoryData';
import { DataEvents } from '@/lib/events';

const ProductionChart = dynamic(() => import('@/components/charts/ProductionChart'), { ssr: false });
const EfficiencyChart = dynamic(() => import('@/components/charts/EfficiencyChart'), { ssr: false });
const AICommandCenter = dynamic(() => import('@/components/ai/AICommandCenter'), { ssr: false });

function ChangeTag({ value, positive }) {
  const isPositive = positive !== undefined ? positive : (value || '').startsWith('+');
  const isZero = value === '+0.0%' || value === '0' || value === '+0';
  const Icon = isZero ? FaMinus : isPositive ? FaArrowUp : FaArrowDown;
  const color = isZero ? '#64748b' : isPositive ? '#10b981' : '#f43f5e';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color }}>
      <Icon size={8} />
      {value}
      <span style={{ color:'#475569', fontWeight:400, fontSize:10 }}>vs last month</span>
    </span>
  );
}

const AI_FEATURES = [
  { id: 'maintenance', title: 'Predictive Maintenance', subtitle: 'Equipment failure prediction', icon: FaCog,       color: '#f59e0b' },
  { id: 'resources',   title: 'Resource Optimization',  subtitle: 'Staffing & allocation',       icon: FaUsers,     color: '#10b981' },
  { id: 'quality',     title: 'Quality Control AI',     subtitle: 'Defect pattern analysis',     icon: FaShieldAlt, color: '#f43f5e' },
  { id: 'benchmark',   title: 'Performance Benchmark',  subtitle: 'Industry comparison',         icon: FaChartBar,  color: '#6366f1' },
];

export default function Dashboard() {
  const [showAI, setShowAI] = useState(false);

  const { data: summary, loading: loadingSummary } = useFactoryData('/analytics/executive-summary', {
    listenTo: [DataEvents.PRODUCTION_CHANGED, DataEvents.EMPLOYEES_CHANGED],
  });
  const { data: prodData, loading: loadingProd } = useFactoryData('/production', {
    listenTo: [DataEvents.PRODUCTION_CHANGED],
  });

  const production = useMemo(() => prodData || [], [prodData]);
  const loading    = loadingSummary || loadingProd;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid-industrial-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
        <div className="skeleton h-80" />
      </div>
    );
  }

  const defectPositive = (summary?.defectChange || '+0.0%').startsWith('-'); // lower is better

  const kpis = [
    {
      label:    'Production Output',
      value:    (summary?.totalUnits ?? 0).toLocaleString(),
      unit:     'units total',
      sub:      `Today: ${(summary?.todayUnits ?? 0).toLocaleString()} units`,
      change:   summary?.productionChange || '+0.0%',
      positive: !(summary?.productionChange || '').startsWith('-'),
      icon:     FaIndustry,
      color:    'var(--color-info)',
      accent:   'rgba(99,102,241,0.12)',
    },
    {
      label:    'Active Workforce',
      value:    (summary?.activeEmployees ?? 0).toString(),
      unit:     `of ${summary?.totalEmployees ?? 0} total`,
      sub:      `Productivity: ${(summary?.workforceProductivity ?? 0).toLocaleString()} u/emp`,
      change:   null,
      positive: true,
      icon:     FaUsers,
      color:    'var(--color-success)',
      accent:   'rgba(16,185,129,0.12)',
    },
    {
      label:    'System Efficiency',
      value:    `${(summary?.avgEfficiency ?? 0).toFixed(1)}%`,
      unit:     '',
      sub:      `Trend: ${summary?.trend || 'stable'}`,
      change:   summary?.efficiencyChange || '+0.0%',
      positive: !(summary?.efficiencyChange || '').startsWith('-'),
      icon:     FaTachometerAlt,
      color:    'var(--chart-2)',
      accent:   'rgba(139,92,246,0.12)',
    },
    {
      label:    'Defect Rate',
      value:    `${(summary?.avgDefectRate ?? 0).toFixed(2)}%`,
      unit:     '',
      sub:      `${(summary?.totalDefects ?? 0).toLocaleString()} total defects`,
      change:   summary?.defectChange || '+0.0%',
      positive: defectPositive,
      icon:     FaExclamationTriangle,
      color:    (summary?.avgDefectRate || 0) > 5 ? 'var(--color-danger)' : 'var(--color-warning)',
      accent:   (summary?.avgDefectRate || 0) > 5 ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Executive Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Real-time industrial metrics &nbsp;·&nbsp;
            <span className={`font-medium ${summary?.trend === 'increasing' ? 'text-[var(--color-success)]' : summary?.trend === 'declining' ? 'text-[var(--color-danger)]' : 'text-[var(--text-tertiary)]'}`}>
              {summary?.trend === 'increasing' ? '↑ Production trending up' : summary?.trend === 'declining' ? '↓ Production declining' : '→ Production stable'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {summary?.todayRecords > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
              <FaCalendarDay size={10} />
              {summary.todayRecords} records today
            </div>
          )}
          {(summary?.profit ?? 0) > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
              <FaMoneyBillWave size={10} />
              ₹{((summary.profit) / 1000).toFixed(0)}k profit
            </div>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid-industrial-4">
        {kpis.map((kpi, idx) => (
          <motion.div key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="kpi-card"
            style={{ borderTop: `3px solid ${kpi.color}` }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="kpi-label">{kpi.label}</span>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: kpi.accent }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
            </div>
            <div className="kpi-value" style={{ fontSize: '1.65rem', lineHeight: 1 }}>
              {kpi.value}
              {kpi.unit && <span className="text-sm text-[var(--text-tertiary)] ml-1.5 font-normal">{kpi.unit}</span>}
            </div>
            <div className="mt-1 mb-2 text-xs text-[var(--text-muted)]">{kpi.sub}</div>
            {kpi.change && <ChangeTag value={kpi.change} positive={kpi.positive} />}
          </motion.div>
        ))}
      </div>

      {/* ── AI Command Center ────────────────────────────────────────── */}
      <style>{`
        @keyframes aiGradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes aiOrbitPulse { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.18);opacity:.15} }
        @keyframes aiFeatureHover { from{transform:translateY(0)} to{transform:translateY(-3px)} }
      `}</style>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, type: 'spring', stiffness: 280, damping: 24 }}>
        {/* Hero banner */}
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 20,
          background: 'linear-gradient(135deg, #0f0f16 0%, #13111e 40%, #0d1219 100%)',
          border: '1px solid rgba(99,102,241,0.22)',
          boxShadow: '0 8px 40px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.04)',
          padding: '32px 32px 28px',
        }}>
          {/* Ambient glow blobs */}
          <div style={{ position:'absolute', top:-60, left:-40, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-80, right:-20, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:40, right:160, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />

          {/* Top row — label + CTA */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap', position:'relative', zIndex:1, marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              {/* Animated robot icon */}
              <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
                <div style={{ position:'absolute', inset:-4, borderRadius:'50%', background:'rgba(99,102,241,0.25)', animation:'aiOrbitPulse 2.8s ease-in-out infinite' }} />
                <div style={{
                  width:52, height:52, borderRadius:16,
                  background:'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 4px 20px rgba(99,102,241,0.5)',
                }}>
                  <FaRobot size={22} color="#fff" />
                </div>
              </div>
              <div>
                <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'#6366f1', fontWeight:700, marginBottom:4 }}>
                  Industrial Intelligence Suite
                </p>
                <h2 style={{ fontSize:20, fontWeight:700, color:'#f0f0f8', letterSpacing:'-0.02em', lineHeight:1.1, marginBottom:5 }}>
                  AI Command Center
                </h2>
                <p style={{ fontSize:12, color:'#54546a', lineHeight:1.5 }}>
                  4 AI-powered engines · Predictive · Adaptive · Real-time
                </p>
              </div>
            </div>

            {/* Big CTA button */}
            <motion.button
              onClick={() => setShowAI(true)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display:'inline-flex', alignItems:'center', gap:10,
                padding:'14px 28px',
                borderRadius:14, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                backgroundSize:'200% 200%',
                animation:'aiGradientShift 4s ease infinite',
                color:'#fff', fontWeight:700, fontSize:14, letterSpacing:'-0.01em',
                boxShadow:'0 4px 24px rgba(99,102,241,0.55), 0 1px 0 rgba(255,255,255,0.12) inset',
                fontFamily:'inherit', flexShrink:0,
                transition:'box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 32px rgba(99,102,241,0.75), 0 1px 0 rgba(255,255,255,0.12) inset'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='0 4px 24px rgba(99,102,241,0.55), 0 1px 0 rgba(255,255,255,0.12) inset'; }}
            >
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <FaRobot size={13} />
              </div>
              Launch AI Suite
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity:0.8 }}>
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          </div>

          {/* 4 Feature cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12, position:'relative', zIndex:1 }}>
            {AI_FEATURES.map((f, i) => (
              <motion.button
                key={f.id}
                onClick={() => setShowAI(true)}
                initial={{ opacity:0, y:12 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                whileHover={{ y: -4, transition:{ duration:0.18 } }}
                whileTap={{ scale: 0.97 }}
                style={{
                  textAlign:'left', padding:'16px 18px', borderRadius:14,
                  background:`linear-gradient(135deg, ${f.color}0d 0%, ${f.color}06 100%)`,
                  border:`1px solid ${f.color}28`,
                  cursor:'pointer', fontFamily:'inherit',
                  transition:'border-color 0.2s, box-shadow 0.2s',
                  boxShadow:`0 2px 12px ${f.color}0a`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=f.color+'55'; e.currentTarget.style.boxShadow=`0 6px 24px ${f.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=f.color+'28'; e.currentTarget.style.boxShadow=`0 2px 12px ${f.color}0a`; }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${f.color}18`, border:`1px solid ${f.color}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <f.icon size={15} style={{ color: f.color }} />
                  </div>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:f.color, boxShadow:`0 0 8px ${f.color}`, flexShrink:0, opacity:0.7 }} />
                </div>
                <p style={{ fontSize:12.5, fontWeight:700, color:'#e8e8f4', marginBottom:3, letterSpacing:'-0.01em' }}>{f.title}</p>
                <p style={{ fontSize:10.5, color:'#54546a', lineHeight:1.45 }}>{f.subtitle}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* AI Command Center Modal */}
      <AnimatePresence>
        {showAI && <AICommandCenter onClose={() => setShowAI(false)} />}
      </AnimatePresence>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProductionChart records={production} />
        <EfficiencyChart records={production} />
      </div>

      {/* Recent Production Table */}
      <div className="industrial-card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Production Records</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Latest entries from production database</p>
          </div>
          <Link href="/production" className="btn-industrial btn-secondary text-xs flex items-center gap-2">
            <span>View All</span>
            <FaArrowRight size={10} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table-industrial">
            <thead>
              <tr>
                <th>Product</th>
                <th>Units</th>
                <th>Defects</th>
                <th>Efficiency</th>
                <th>Shift</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {production.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-[var(--text-muted)] py-8 text-sm">No production records yet</td></tr>
              ) : production.slice(0, 10).map((record, idx) => {
                const eff = record.units > 0 ? ((record.units - record.defects) / record.units * 100) : 0;
                return (
                  <tr key={idx}>
                    <td className="font-medium">{record.product?.name || 'N/A'}</td>
                    <td>{record.units.toLocaleString()}</td>
                    <td>
                      <span className={(record.defects / record.units * 100) > 5 ? 'text-[var(--color-danger)]' : ''}>
                        {record.defects}
                      </span>
                    </td>
                    <td>
                      <span className={eff >= 95 ? 'text-[var(--color-success)]' : eff >= 85 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}>
                        {eff.toFixed(1)}%
                      </span>
                    </td>
                    <td><span className="badge badge-neutral text-[10px]">{record.shift}</span></td>
                    <td className="text-xs text-[var(--text-tertiary)]">
                      {new Date(record.productionDate).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className={`status-dot ${eff >= 95 ? 'status-active' : eff >= 85 ? 'status-warning' : 'status-error'}`} />
                        <span className="text-xs">{eff >= 95 ? 'Excellent' : eff >= 85 ? 'Normal' : 'Review'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
