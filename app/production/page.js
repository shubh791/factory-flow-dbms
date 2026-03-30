'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaIndustry, FaPlus, FaSearch, FaFilter, FaDownload, FaChartLine } from 'react-icons/fa';
import API from '@/lib/api';
import Link from 'next/link';

export default function ProductionPage() {
  const [production, setProduction] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [shift, setShift] = useState('all');

  useEffect(() => {
    API.get('/production')
      .then(res => {
        setProduction(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = production.filter(record => {
    const matchesSearch = record.product?.name.toLowerCase().includes(search.toLowerCase());
    const matchesShift = shift === 'all' || record.shift === shift;
    return matchesSearch && matchesShift;
  });

  const stats = {
    totalUnits: production.reduce((sum, r) => sum + r.units, 0),
    totalDefects: production.reduce((sum, r) => sum + r.defects, 0),
    avgEfficiency: production.length > 0
      ? (production.reduce((sum, r) => sum + ((r.units - r.defects) / r.units * 100), 0) / production.length)
      : 0,
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-32 mb-4" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Production Records</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manufacturing output, quality metrics, and shift performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-industrial btn-secondary flex items-center gap-2">
            <FaDownload size={12} />
            <span>Export</span>
          </button>
          <Link href="/production/new" className="btn-industrial btn-primary flex items-center gap-2">
            <FaPlus size={12} />
            <span>New Record</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-industrial-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Production</div>
          <div className="kpi-value">{stats.totalUnits.toLocaleString()}</div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1">Units manufactured</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Average Efficiency</div>
          <div className="kpi-value text-[var(--color-success)]">{stats.avgEfficiency.toFixed(1)}%</div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1">Quality performance</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Defects</div>
          <div className="kpi-value text-[var(--color-danger)]">{stats.totalDefects}</div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1">Quality issues detected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="industrial-card-elevated p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={12} />
            <input
              type="text"
              placeholder="Search by product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-industrial pl-9 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-[var(--text-muted)]" size={12} />
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="select-industrial"
            >
              <option value="all">All Shifts</option>
              <option value="MORNING">Morning</option>
              <option value="EVENING">Evening</option>
              <option value="NIGHT">Night</option>
            </select>
          </div>
        </div>
      </div>

      {/* Production Table */}
      <div className="industrial-card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">All Production Records</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{filtered.length} records found</p>
          </div>
          <Link href="/production-insights" className="text-xs text-[var(--color-info)] hover:underline flex items-center gap-1">
            <FaChartLine size={10} />
            <span>View Analytics</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table-industrial">
            <thead>
              <tr>
                <th>Product</th>
                <th>Units Produced</th>
                <th>Defects</th>
                <th>Defect Rate</th>
                <th>Efficiency</th>
                <th>Shift</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const efficiency = record.units > 0 ? ((record.units - record.defects) / record.units * 100) : 0;
                const defectRate = record.units > 0 ? (record.defects / record.units * 100) : 0;
                return (
                  <tr key={record.id}>
                    <td className="font-medium">{record.product?.name || 'N/A'}</td>
                    <td className="font-semibold">{record.units}</td>
                    <td>
                      <span className={defectRate > 5 ? 'text-[var(--color-danger)]' : 'text-[var(--text-primary)]'}>
                        {record.defects}
                      </span>
                    </td>
                    <td>
                      <span className={defectRate > 5 ? 'text-[var(--color-danger)]' : defectRate > 2 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}>
                        {defectRate.toFixed(2)}%
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
                    <td className="text-xs">{record.employee?.name || 'Unassigned'}</td>
                    <td className="text-xs text-[var(--text-tertiary)]">
                      {new Date(record.productionDate).toLocaleDateString()}
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
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)]">
            No production records found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}
