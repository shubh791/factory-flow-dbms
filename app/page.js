'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaIndustry, FaUsers, FaTachometerAlt, FaExclamationTriangle, FaBrain, FaArrowRight } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import API from '@/lib/api';
import AICommandCenter from '@/components/ai/AICommandCenter';
import KPIStats from '@/components/charts/KPIStats';

const ProductionChart = dynamic(() => import('@/components/charts/ProductionChart'), { ssr: false });
const EfficiencyChart = dynamic(() => import('@/components/charts/EfficiencyChart'), { ssr: false });

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [production, setProduction] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get('/analytics/executive-summary'),
      API.get('/production')
    ]).then(([summaryRes, prodRes]) => {
      setSummary(summaryRes.data);
      setProduction(prodRes.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid-industrial-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Production Output',
      value: summary?.totalProduction?.toLocaleString() || '0',
      unit: 'units',
      change: summary?.productionChange || '+12.5%',
      positive: true,
      icon: FaIndustry,
      color: 'var(--color-info)',
    },
    {
      label: 'Active Workforce',
      value: summary?.activeEmployees || '0',
      unit: 'employees',
      change: '+3',
      positive: true,
      icon: FaUsers,
      color: 'var(--color-success)',
    },
    {
      label: 'System Efficiency',
      value: summary?.avgEfficiency ? `${summary.avgEfficiency.toFixed(1)}%` : '0%',
      unit: '',
      change: '+2.1%',
      positive: true,
      icon: FaTachometerAlt,
      color: 'var(--chart-2)',
    },
    {
      label: 'Defect Rate',
      value: summary?.avgDefectRate ? `${summary.avgDefectRate.toFixed(2)}%` : '0%',
      unit: '',
      change: '-0.5%',
      positive: true,
      icon: FaExclamationTriangle,
      color: (summary?.avgDefectRate || 0) > 5 ? 'var(--color-danger)' : 'var(--color-warning)',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Executive Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">Real-time industrial performance metrics and analytics</p>
        </div>
        <button
          onClick={() => setShowAI(true)}
          className="btn-industrial btn-primary flex items-center gap-2"
        >
          <FaBrain size={14} />
          <span>AI Intelligence</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid-industrial-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="kpi-card"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="kpi-label">{kpi.label}</span>
              <div
                className="w-9 h-9 rounded flex items-center justify-center"
                style={{ background: `${kpi.color}20` }}
              >
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
            </div>
            <div className="kpi-value">
              {kpi.value}
              {kpi.unit && <span className="text-lg text-[var(--text-tertiary)] ml-1">{kpi.unit}</span>}
            </div>
            {kpi.change && (
              <div className={`kpi-change ${kpi.positive ? 'positive' : 'negative'}`}>
                <span>{kpi.change}</span>
                <span className="text-xs text-[var(--text-tertiary)]">vs last period</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {production.slice(0, 10).map((record, idx) => {
                const efficiency = record.units > 0 ? ((record.units - record.defects) / record.units * 100) : 0;
                return (
                  <tr key={idx}>
                    <td className="font-medium">{record.product?.name || 'N/A'}</td>
                    <td>{record.units}</td>
                    <td>
                      <span className={record.defects > record.units * 0.05 ? 'text-[var(--color-danger)]' : 'text-[var(--text-primary)]'}>
                        {record.defects}
                      </span>
                    </td>
                    <td>
                      <span className={efficiency >= 95 ? 'text-[var(--color-success)]' : efficiency >= 85 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}>
                        {efficiency.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral text-[10px]">{record.shift}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className={`status-dot ${efficiency >= 95 ? 'status-active' : efficiency >= 85 ? 'status-warning' : 'status-error'}`} />
                        <span className="text-xs">
                          {efficiency >= 95 ? 'Excellent' : efficiency >= 85 ? 'Normal' : 'Review'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAI && <AICommandCenter onClose={() => setShowAI(false)} />}
    </div>
  );
}
