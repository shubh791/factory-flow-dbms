'use client';

import { useState, useMemo } from 'react';
import { FaUserPlus, FaEdit, FaTimes, FaSave, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import API from '@/lib/api';
import { useFactoryData, invalidateCache } from '@/lib/hooks/useFactoryData';
import { emit, DataEvents } from '@/lib/events';

export default function EmployeesPage() {
  const { data: empData,  loading, refresh: refreshEmp } = useFactoryData('/employees', {
    listenTo: [DataEvents.EMPLOYEES_CHANGED],
  });
  const { data: deptData } = useFactoryData('/departments');
  const { data: roleData } = useFactoryData('/roles');

  const employees   = useMemo(() => empData  || [], [empData]);
  const departments = useMemo(() => deptData || [], [deptData]);
  const roles       = useMemo(() => roleData || [], [roleData]);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    employeeCode: '',
    email: '',
    phone: '',
    experience: 0,
    departmentId: '',
    roleId: '',
    status: 'ACTIVE',
  });

  const fetchData = () => {
    invalidateCache(['/employees', '/departments', '/roles', '/analytics/executive-summary']);
    refreshEmp();
    emit(DataEvents.EMPLOYEES_CHANGED);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await API.patch(`/employees/${formData.id}`, {
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          experience: Number(formData.experience),
          departmentId: Number(formData.departmentId),
          roleId: Number(formData.roleId),
          status: formData.status,
        });
      } else {
        await API.post('/employees', {
          name: formData.name,
          employeeCode: formData.employeeCode,
          email: formData.email || null,
          phone: formData.phone || null,
          experience: Number(formData.experience),
          departmentId: Number(formData.departmentId),
          roleId: Number(formData.roleId),
        });
      }
      fetchData();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Operation failed');
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setFormData({
      id: null,
      name: '',
      employeeCode: '',
      email: '',
      phone: '',
      experience: 0,
      departmentId: departments[0]?.id || '',
      roleId: roles[0]?.id || '',
    });
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    setEditMode(true);
    setFormData({
      id: emp.id,
      name: emp.name,
      employeeCode: emp.employeeCode,
      email: emp.email || '',
      phone: emp.phone || '',
      experience: emp.experience,
      departmentId: emp.departmentId,
      roleId: emp.roleId,
      status: emp.status || 'ACTIVE',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      id: null,
      name: '',
      employeeCode: '',
      email: '',
      phone: '',
      experience: 0,
      departmentId: '',
      roleId: '',
      status: 'ACTIVE',
    });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await API.delete(`/employees/${confirmDelete.id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Delete failed');
    } finally {
      setConfirmDelete(null);
    }
  };

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Workforce Management</h1>
          <p className="text-sm text-[var(--text-secondary)]">Employee records, performance, and resource allocation</p>
        </div>
        <button onClick={openAddModal} className="btn-industrial btn-primary flex items-center gap-2">
          <FaUserPlus size={12} />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="grid-industrial-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Workforce</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Status</div>
          <div className="kpi-value text-[var(--color-success)]">{stats.active}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">On Leave</div>
          <div className="kpi-value text-[var(--color-warning)]">{stats.onLeave}</div>
        </div>
      </div>

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
              {employees.map((emp) => (
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
                  <td>{emp.role?.title || 'N/A'}</td>
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
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="text-xs text-[var(--color-info)] hover:underline flex items-center gap-1"
                      >
                        <FaEdit size={10} />
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: emp.id, name: emp.name })}
                        className="text-xs text-[var(--color-danger)] hover:underline flex items-center gap-1"
                      >
                        <FaTrash size={10} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Delete confirmation ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="industrial-card-elevated w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center">
                <FaExclamationTriangle size={18} className="text-[var(--color-danger)]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Are you sure?</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Delete employee <strong className="text-[var(--text-primary)]">{confirmDelete.name}</strong>? All their production records and data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-industrial btn-secondary flex-1"
              >
                No
              </button>
              <button
                onClick={handleDelete}
                className="btn-industrial flex-1 flex items-center justify-center gap-2"
                style={{ background: 'var(--color-danger)', color: '#fff', border: 'none' }}
              >
                <FaTrash size={11} />
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="industrial-card-elevated w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {editMode ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button onClick={closeModal} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-industrial"
                  placeholder="Full name"
                />
              </div>

              {!editMode && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="input-industrial"
                    placeholder="E.g., EMP001"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-industrial"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-industrial"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="input-industrial"
                />
              </div>

              {editMode && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Employment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="select-industrial"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="RESIGNED">Resigned</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Department *</label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="select-industrial"
                  >
                    <option value="">Select...</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Role *</label>
                  <select
                    required
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="select-industrial"
                  >
                    <option value="">Select...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-industrial btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-industrial btn-primary flex-1 flex items-center justify-center gap-2">
                  <FaSave size={12} />
                  <span>{editMode ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
