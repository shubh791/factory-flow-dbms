'use client';

import { useState, useMemo } from 'react';
import { FaPlus, FaEdit, FaTimes, FaSave, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import API from '@/lib/api';
import { useFactoryData, invalidateCache } from '@/lib/hooks/useFactoryData';
import { emit, DataEvents } from '@/lib/events';

export default function ProductionPage() {
  const { data: prodData,  loading, refresh: refreshProd } = useFactoryData('/production', {
    listenTo: [DataEvents.PRODUCTION_CHANGED],
  });
  const { data: productsData } = useFactoryData('/products');
  const { data: empData }      = useFactoryData('/employees');

  const production = useMemo(() => prodData     || [], [prodData]);
  const products   = useMemo(() => productsData || [], [productsData]);
  const employees  = useMemo(() => empData      || [], [empData]);

  const today = new Date().toISOString().slice(0, 10);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label }
  const [formData, setFormData] = useState({
    id: null,
    units: '',
    defects: '',
    productId: '',
    employeeId: '',
    shift: 'MORNING',
    productionDate: today,
  });

  const fetchData = () => {
    invalidateCache(['/production', '/products', '/employees', '/analytics/executive-summary']);
    refreshProd();
    emit(DataEvents.PRODUCTION_CHANGED);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await API.patch(`/production/${formData.id}`, {
          units: Number(formData.units),
          defects: Number(formData.defects),
          productId: Number(formData.productId),
          employeeId: formData.employeeId ? Number(formData.employeeId) : null,
          shift: formData.shift,
          productionDate: formData.productionDate || undefined,
        });
      } else {
        await API.post('/production', {
          units: Number(formData.units),
          defects: Number(formData.defects),
          productId: Number(formData.productId),
          employeeId: formData.employeeId ? Number(formData.employeeId) : null,
          shift: formData.shift,
          productionDate: formData.productionDate || undefined,
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
      id: null, units: '', defects: '0',
      productId: products[0]?.id || '',
      employeeId: employees.find(e => e.status === 'ACTIVE')?.id || '',
      shift: 'MORNING',
      productionDate: today,
    });
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setEditMode(true);
    setFormData({
      id: record.id,
      units: record.units,
      defects: record.defects,
      productId: record.product?.id || '',
      employeeId: record.employee?.id || '',
      shift: record.shift,
      productionDate: record.productionDate ? new Date(record.productionDate).toISOString().slice(0, 10) : today,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await API.delete(`/production/${confirmDelete.id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Delete failed');
    } finally {
      setConfirmDelete(null);
    }
  };

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Production Records</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manufacturing output, quality metrics, and shift performance</p>
        </div>
        <button onClick={openAddModal} className="btn-industrial btn-primary flex items-center gap-2">
          <FaPlus size={12} />
          <span>New Record</span>
        </button>
      </div>

      <div className="grid-industrial-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Production</div>
          <div className="kpi-value">{stats.totalUnits.toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Average Efficiency</div>
          <div className="kpi-value text-[var(--color-success)]">{stats.avgEfficiency.toFixed(1)}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Defects</div>
          <div className="kpi-value text-[var(--color-danger)]">{stats.totalDefects}</div>
        </div>
      </div>

      <div className="industrial-card-elevated p-5">
        <div className="overflow-x-auto">
          <table className="table-industrial">
            <thead>
              <tr>
                <th>Product</th>
                <th>Units</th>
                <th>Defects</th>
                <th>Efficiency</th>
                <th>Shift</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {production.map((record) => {
                const efficiency = record.units > 0 ? ((record.units - record.defects) / record.units * 100) : 0;
                return (
                  <tr key={record.id}>
                    <td className="font-medium">{record.product?.name || 'N/A'}</td>
                    <td className="font-semibold">{record.units}</td>
                    <td>
                      <span className={(record.defects / record.units * 100) > 5 ? 'text-[var(--color-danger)]' : 'text-[var(--text-primary)]'}>
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
                    <td className="text-xs">{record.employee?.name || 'Unassigned'}</td>
                    <td className="text-xs text-[var(--text-tertiary)]">
                      {new Date(record.productionDate).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(record)}
                          className="text-xs text-[var(--color-info)] hover:underline flex items-center gap-1"
                        >
                          <FaEdit size={10} />
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ id: record.id, label: `${record.product?.name || 'Record'} — ${record.units} units` })}
                          className="text-xs text-[var(--color-danger)] hover:underline flex items-center gap-1"
                        >
                          <FaTrash size={10} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
              Delete production record <strong className="text-[var(--text-primary)]">{confirmDelete.label}</strong>?
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
                {editMode ? 'Edit Production Record' : 'Add Production Record'}
              </h3>
              <button onClick={closeModal} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Product *</label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="select-industrial"
                >
                  <option value="">Select product...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Units Produced *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                    className="input-industrial"
                    placeholder="e.g., 100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Defects</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.defects}
                    onChange={(e) => setFormData({ ...formData, defects: e.target.value })}
                    className="input-industrial"
                    placeholder="e.g., 5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Shift *</label>
                  <select
                    required
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="select-industrial"
                  >
                    <option value="MORNING">Morning</option>
                    <option value="EVENING">Evening</option>
                    <option value="NIGHT">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Employee *</label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="select-industrial"
                  >
                    <option value="">Select employee...</option>
                    {employees.filter(e => e.status === 'ACTIVE').map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Production Date</label>
                <input
                  type="date"
                  value={formData.productionDate}
                  onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                  className="input-industrial"
                />
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
