'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FaIndustry, FaUsers, FaTachometerAlt, FaExclamationTriangle,
  FaArrowRight, FaArrowUp, FaArrowDown, FaMinus,
  FaCalendarDay, FaMoneyBillWave,
} from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { useFactoryData } from '@/lib/hooks/useFactoryData';
import { DataEvents } from '@/lib/events';

const ProductionChart = dynamic(() => import('@/components/charts/ProductionChart'), { ssr: false });
const EfficiencyChart = dynamic(() => import('@/components/charts/EfficiencyChart'), { ssr: false });

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

export default function Dashboard() {
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
