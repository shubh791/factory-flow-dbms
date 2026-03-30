'use client';

import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useEmployees } from '@/lib/hooks/useEmployees';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EmployeeTable from '@/components/employees/EmployeeTable';
import EditEmployeeModal from '@/components/employees/EditEmployeeModal';
import DeleteEmployeeModal from '@/components/employees/DeleteEmployeeModal';
import { FaUsers } from 'react-icons/fa';

export default function Employees() {
  /* ── Form state ──────────────────────────────────────────────── */
  const [name,         setName]         = useState('');
  const [experience,   setExperience]   = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [roleId,       setRoleId]       = useState('');

  /* ── UI state ────────────────────────────────────────────────── */
  const [search,            setSearch]            = useState('');
  const [editData,          setEditData]          = useState(null);
  const [deleteId,          setDeleteId]          = useState(null);
  const [showDeleteAll,     setShowDeleteAll]     = useState(false);
  const [file,              setFile]              = useState(null);
  const [uploading,         setUploading]         = useState(false);
  const [toast,             setToast]             = useState('');
  const fileRef = useRef();

  /* ── Shared hook ─────────────────────────────────────────────── */
  const {
    employees, departments, roles, loading,
    addEmployee, updateEmployee, deleteEmployee, clearAll, uploadCSV,
  } = useEmployees();

  /* ── Toast helper ────────────────────────────────────────────── */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  /* ── Search with debounce ────────────────────────────────────── */
  const debouncedSearch = useDebounce(search, 250);
  const filtered = useMemo(() =>
    employees.filter((e) =>
      e.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.employeeCode?.toLowerCase().includes(debouncedSearch.toLowerCase())
    ),
    [employees, debouncedSearch]
  );

  /* ── Add ─────────────────────────────────────────────────────── */
  const handleAdd = async () => {
    if (!name || !departmentId || !employeeCode || !roleId) {
      showToast('Fill all required fields');
      return;
    }
    try {
      await addEmployee({ name, experience: Number(experience), departmentId, employeeCode, roleId });
      setName(''); setExperience(''); setDepartmentId(''); setEmployeeCode(''); setRoleId('');
      showToast('Employee added');
    } catch { showToast('Failed to add employee'); }
  };

  /* ── Update ──────────────────────────────────────────────────── */
  const handleUpdate = async () => {
    try {
      await updateEmployee(editData.id, editData);
      setEditData(null);
      showToast('Updated');
    } catch { showToast('Update failed'); }
  };

  /* ── Delete ──────────────────────────────────────────────────── */
  const confirmDelete = async () => {
    try {
      await deleteEmployee(deleteId);
      setDeleteId(null);
      showToast('Deleted');
    } catch { showToast('Delete failed'); }
  };

  /* ── Clear all ───────────────────────────────────────────────── */
  const handleClearAll = async () => {
    try {
      const res = await clearAll();
      setShowDeleteAll(false);
      showToast(`${res.deletedCount ?? 0} employees removed`);
    } catch { showToast('Bulk delete failed'); }
  };

  /* ── Upload CSV ──────────────────────────────────────────────── */
  const handleUploadCSV = async () => {
    if (!file) { showToast('Select a CSV first'); return; }
    try {
      setUploading(true);
      const res = await uploadCSV(file);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      showToast(`Uploaded ${res.inserted ?? 'employees'}`);
    } catch { showToast('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Page Header */}
      <div className="ff-page-header">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8' }}>
            <FaUsers size={13} />
          </div>
          <p className="ff-label">Operations · Workforce</p>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.02em' }}>
          Workforce Management
        </h1>
        <p style={{ fontSize: 12, color: '#54546a', marginTop: 4 }}>
          Employee records, roles, and department assignments
        </p>
      </div>

      {/* Add Employee Form */}
      <div className="ff-card p-5">
        <p className="ff-label mb-3">Add Employee</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input
            placeholder="Employee Code"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            className="ff-input"
          />
          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => { if (/^[A-Za-z\s]*$/.test(e.target.value)) setName(e.target.value); }}
            className="ff-input"
          />
          <input
            type="number" min="0"
            placeholder="Experience (yrs)"
            value={experience}
            onChange={(e) => { if (/^\d*$/.test(e.target.value)) setExperience(e.target.value); }}
            className="ff-input"
          />
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="ff-select">
            <option value="">Department</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="ff-select">
            <option value="">Role</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          <button onClick={handleAdd} className="ff-btn ff-btn-primary">Add Employee</button>
        </div>
      </div>

      {/* Search + Upload toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex items-center gap-2 flex-1 rounded-xl px-3" style={{ background: '#17171c', border: '1px solid #2c2c38' }}>
          <SearchIcon style={{ color: '#54546a', fontSize: 18 }} />
          <input
            placeholder="Search employees…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f0f0f4', fontSize: 13, padding: '10px 0', flex: 1 }}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file" ref={fileRef} accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ fontSize: 12, color: '#9090a4', cursor: 'pointer', maxWidth: 180 }}
          />
          <button onClick={handleUploadCSV} disabled={uploading} className="ff-btn ff-btn-success">
            {uploading
              ? <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: '#10b981', borderTopColor: 'transparent' }} />
              : <CloudUploadIcon style={{ fontSize: 15 }} />
            }
            Upload CSV
          </button>
          <button onClick={() => setShowDeleteAll(true)} className="ff-btn ff-btn-danger">
            <DeleteForeverIcon style={{ fontSize: 15 }} />
            Clear All
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && employees.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="ff-skeleton rounded-xl" style={{ height: 44 }} />
          ))}
        </div>
      )}

      {/* Table */}
      <EmployeeTable employees={filtered} onEdit={setEditData} onDelete={setDeleteId} />

      {/* Edit Modal */}
      <EditEmployeeModal
        editData={editData} setEditData={setEditData}
        departments={departments}
        onUpdate={handleUpdate} onClose={() => setEditData(null)}
      />

      {/* Delete Modal */}
      <DeleteEmployeeModal
        deleteId={deleteId} onDelete={confirmDelete} onClose={() => setDeleteId(null)}
      />

      {/* Clear All Modal */}
      {showDeleteAll && (
        <div className="ff-modal-backdrop">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ff-modal"
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f4', marginBottom: 10 }}>
              Confirm Bulk Deletion
            </h3>
            <p style={{ fontSize: 13, color: '#9090a4', lineHeight: 1.6, marginBottom: 20 }}>
              This will permanently delete <strong style={{ color: '#f0f0f4' }}>all employees</strong>.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteAll(false)} className="ff-btn ff-btn-secondary">Cancel</button>
              <button onClick={handleClearAll} className="ff-btn ff-btn-danger">Delete All</button>
            </div>
          </motion.div>
        </div>
      )}

      {toast && <div className="ff-toast">{toast}</div>}
    </motion.div>
  );
}
