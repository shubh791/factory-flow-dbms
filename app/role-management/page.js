'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTimes, FaSave, FaUsers } from 'react-icons/fa';
import API from '@/lib/api';

export default function RoleManagementPage() {
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    level: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roleRes, empRes] = await Promise.all([
        API.get('/roles'),
        API.get('/employees'),
      ]);
      setRoles(roleRes.data || []);
      setEmployees(empRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/roles', {
        title: formData.title,
        level: Number(formData.level),
        description: formData.description || null,
      });
      fetchData();
      closeModal();
      alert('Role created successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create role');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ title: '', level: '', description: '' });
  };

  const getRoleEmployeeCount = (roleId) => {
    return employees.filter(e => e.roleId === roleId).length;
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Role Management</h1>
          <p className="text-sm text-[var(--text-secondary)]">Organizational hierarchy and position definitions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-industrial btn-primary flex items-center gap-2">
          <FaPlus size={12} />
          <span>Add Role</span>
        </button>
      </div>

      <div className="industrial-card-elevated p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Role Hierarchy (Level 1 = Top)</h3>
        <div className="space-y-3">
          {roles.map((role) => {
            const empCount = getRoleEmployeeCount(role.id);
            return (
              <div
                key={role.id}
                className="flex items-center gap-4 p-4 rounded bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-[var(--color-info)] flex items-center justify-center text-white font-bold text-lg">
                  {role.level}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-[var(--text-primary)]">{role.title}</h4>
                    <span className="badge badge-info text-[10px]">
                      Level {role.level}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">{role.description || 'No description provided'}</p>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <FaUsers size={14} />
                  <span className="text-sm font-medium">{empCount}</span>
                </div>
              </div>
            );
          })}
        </div>
        {roles.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)]">
            No roles defined yet. Create your first role to get started.
          </div>
        )}
      </div>

      <div className="industrial-card-elevated p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Employee Distribution by Role</h3>
        <div className="space-y-2">
          {roles.map((role) => {
            const count = getRoleEmployeeCount(role.id);
            const percentage = employees.length > 0 ? (count / employees.length * 100) : 0;
            return (
              <div key={role.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">{role.title}</span>
                  <span className="text-[var(--text-tertiary)]">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-tertiary)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-info)]" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="industrial-card-elevated w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Create New Role
              </h3>
              <button onClick={closeModal} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-industrial"
                  placeholder="e.g., Senior Manager"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Hierarchy Level * (1 = Highest)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="input-industrial"
                  placeholder="e.g., 1"
                />
                <div className="text-xs text-[var(--text-tertiary)] mt-1">
                  Lower numbers = Higher authority. Level 1 is top management.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-industrial"
                  rows="3"
                  placeholder="Describe the role responsibilities..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-industrial btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-industrial btn-primary flex-1 flex items-center justify-center gap-2">
                  <FaSave size={12} />
                  <span>Create Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
