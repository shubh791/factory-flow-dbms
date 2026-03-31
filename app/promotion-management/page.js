'use client';

import { useState, useEffect } from 'react';
import { FaUserTie, FaArrowRight, FaSave, FaTimes } from 'react-icons/fa';
import API from '@/lib/api';

export default function PromotionManagement() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    newRoleId: '',
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, roleRes, promRes] = await Promise.all([
        API.get('/employees'),
        API.get('/roles'),
        API.get('/promotions'),
      ]);
      setEmployees(empRes.data || []);
      setRoles(roleRes.data || []);
      setPromotions(promRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id === Number(formData.employeeId));
  const currentRole = selectedEmployee?.role;
  const availableRoles = roles.filter(r => currentRole && r.level > currentRole.level);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/promotions', {
        employeeId: Number(formData.employeeId),
        newRoleId: Number(formData.newRoleId),
        remarks: formData.remarks || null,
      });
      fetchData();
      closeModal();
      alert('Promotion successful!');
    } catch (error) {
      alert(error.response?.data?.error || 'Promotion failed');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ employeeId: '', newRoleId: '', remarks: '' });
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Promotion Management</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage employee role changes and career progression</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-industrial btn-primary flex items-center gap-2">
          <FaUserTie size={12} />
          <span>Create Promotion</span>
        </button>
      </div>

      <div className="industrial-card-elevated p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Role Hierarchy</h3>
        <div className="space-y-2">
          {roles.map((role, idx) => (
            <div key={role.id} className="flex items-center gap-3 p-3 rounded bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
              <div className="w-8 h-8 rounded bg-[var(--color-info)] flex items-center justify-center text-white text-xs font-bold">
                {role.level}
              </div>
              <div className="flex-1">
                <div className="font-medium text-[var(--text-primary)]">{role.title}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{role.description || 'No description'}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {employees.filter(e => e.roleId === role.id).length} employees
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="industrial-card-elevated p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Promotion History</h3>
        <div className="overflow-x-auto">
          <table className="table-industrial">
            <thead>
              <tr>
                <th>Employee</th>
                <th>From Role</th>
                <th>To Role</th>
                <th>Date</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.id}>
                  <td className="font-medium">{promo.employee?.name}</td>
                  <td>
                    <span className="badge badge-neutral text-[10px]">{promo.oldRole?.title}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <FaArrowRight size={10} className="text-[var(--color-success)]" />
                      <span className="badge badge-success text-[10px]">{promo.newRole?.title}</span>
                    </div>
                  </td>
                  <td className="text-xs text-[var(--text-tertiary)]">
                    {new Date(promo.promotedAt).toLocaleDateString()}
                  </td>
                  <td className="text-xs text-[var(--text-tertiary)]">
                    {promo.remarks || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {promotions.length === 0 && (
            <div className="text-center py-8 text-[var(--text-muted)]">
              No promotions recorded yet
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="industrial-card-elevated w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Create Promotion
              </h3>
              <button onClick={closeModal} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Select Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value, newRoleId: '' })}
                  className="select-industrial"
                >
                  <option value="">Choose employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.role?.title} (Level {emp.role?.level})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee && (
                <>
                  <div className="p-3 rounded bg-[var(--bg-hover)] border border-[var(--border-primary)]">
                    <div className="text-xs text-[var(--text-tertiary)] mb-1">Current Role</div>
                    <div className="font-medium text-[var(--text-primary)]">
                      {currentRole?.title} (Level {currentRole?.level})
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      Promote To *
                    </label>
                    <select
                      required
                      value={formData.newRoleId}
                      onChange={(e) => setFormData({ ...formData, newRoleId: e.target.value })}
                      className="select-industrial"
                      disabled={availableRoles.length === 0}
                    >
                      <option value="">Select new role...</option>
                      {availableRoles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.title} (Level {role.level})
                        </option>
                      ))}
                    </select>
                    {availableRoles.length === 0 && (
                      <div className="text-xs text-[var(--color-warning)] mt-1">
                        No higher-level roles available for promotion
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Remarks (optional)</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="input-industrial"
                  rows="3"
                  placeholder="Add notes about this promotion..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-industrial btn-secondary flex-1">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-industrial btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={!formData.employeeId || !formData.newRoleId || availableRoles.length === 0}
                >
                  <FaSave size={12} />
                  <span>Promote</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
