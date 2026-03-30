'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaUserPlus, FaSearch, FaFilter, FaDownload, FaUserTie } from 'react-icons/fa';
import API from '@/lib/api';
import Link from 'next/link';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    API.get('/employees')
      .then(res => {
        setEmployees(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
                         emp.employeeCode.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || emp.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'ACTIVE').length,
    onLeave: employees.filter(e => e.status === 'ON_LEAVE').length,
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Workforce Management</h1>
          <p className="text-sm text-[var(--text-secondary)]">Employee records, performance, and resource allocation</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-industrial btn-secondary flex items-center gap-2">
            <FaDownload size={12} />
            <span>Export</span>
          </button>
          <Link href="/employees/new" className="btn-industrial btn-primary flex items-center gap-2">
            <FaUserPlus size={12} />
            <span>Add Employee</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-industrial-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Workforce</div>
          <div className="kpi-value">{stats.total}</div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1">Active employees</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Status</div>
          <div className="kpi-value text-[var(--color-success)]">{stats.active}</div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1">Currently working</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">On Leave</div>
          <div className="kpi-value text-[var(--color-warning)]">{stats.onLeave}</div>
          <div className="text-xs text-[var(--text-tertiary)] mt-1">Temporary absence</div>
        </div>
      </div>

      {/* Filters */}
      <div className="industrial-card-elevated p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={12} />
            <input
              type="text"
              placeholder="Search by name or employee code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-industrial pl-9 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-[var(--text-muted)]" size={12} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="select-industrial"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="RESIGNED">Resigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="industrial-card-elevated p-5">
        <div className="overflow-x-auto">
          <table className="table-industrial">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Code</th>
                <th>Department</th>
                <th>Role</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[var(--color-info)] flex items-center justify-center text-white text-xs font-bold">
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{emp.name}</div>
                        <div className="text-xs text-[var(--text-tertiary)]">{emp.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{emp.employeeCode}</td>
                  <td>{emp.department?.name || 'N/A'}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <FaUserTie size={12} className="text-[var(--color-info)]" />
                      <span>{emp.role?.title || 'N/A'}</span>
                    </div>
                  </td>
                  <td>{emp.experience} years</td>
                  <td>
                    <span className={`badge ${
                      emp.status === 'ACTIVE' ? 'badge-success' :
                      emp.status === 'ON_LEAVE' ? 'badge-warning' :
                      'badge-neutral'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/employees/${emp.id}`}
                      className="text-xs text-[var(--color-info)] hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)]">
            No employees found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}
