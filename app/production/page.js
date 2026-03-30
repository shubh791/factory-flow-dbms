'use client';

import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useProduction } from '@/lib/hooks/useProduction';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ProductionTable from '@/components/production/ProductionTable';
import EditProductionModal from '@/components/production/EditProductionModal';
import DeleteProductionModal from '@/components/production/DeleteProductionModal';
import { FaIndustry, FaCircle } from 'react-icons/fa';

export default function Production() {
  /* ── Form state ──────────────────────────────────────────────── */
  const [units,      setUnits]      = useState('');
  const [defects,    setDefects]    = useState('');
  const [productId,  setProductId]  = useState('');
  const [employeeId, setEmployeeId] = useState('');

  /* ── UI state ────────────────────────────────────────────────── */
  const [search,         setSearch]         = useState('');
  const [editData,       setEditData]       = useState(null);
  const [deleteId,       setDeleteId]       = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [file,           setFile]           = useState(null);
  const [uploading,      setUploading]      = useState(false);
  const [toast,          setToast]          = useState('');
  const fileRef = useRef();

  /* ── Shared hook ─────────────────────────────────────────────── */
  const {
    records, products, employees, loading,
    addRecord, updateRecord, deleteRecord, clearAll, uploadCSV,
  } = useProduction();

  /* ── Toast helper ────────────────────────────────────────────── */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  /* ── Search with debounce ────────────────────────────────────── */
  const debouncedSearch = useDebounce(search, 250);
  const filtered = useMemo(() =>
    records.filter((r) =>
      r.product?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      r.employee?.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
    ),
    [records, debouncedSearch]
  );

  /* ── Add record ──────────────────────────────────────────────── */
  const handleAdd = async () => {
    if (!productId)  return showToast('Select a product');
    if (!employeeId) return showToast('Select an employee');
    if (Number(units) < 0 || Number(defects) < 0) return showToast('Invalid values');
    try {
      await addRecord({ units, defects, productId, employeeId });
      setUnits(''); setDefects(''); setProductId(''); setEmployeeId('');
      showToast('Record added');
    } catch { showToast('Failed to add record'); }
  };

  /* ── Update ──────────────────────────────────────────────────── */
  const handleUpdate = async () => {
    try {
      await updateRecord(editData.id, editData);
      setEditData(null);
      showToast('Updated');
    } catch { showToast('Update failed'); }
  };

  /* ── Delete ──────────────────────────────────────────────────── */
  const handleDelete = async () => {
    try {
      await deleteRecord(deleteId);
      setDeleteId(null);
      showToast('Deleted');
    } catch { showToast('Delete failed'); }
  };

  /* ── Clear all ───────────────────────────────────────────────── */
  const handleClearAll = async () => {
    try {
      const res = await clearAll();
      setShowClearModal(false);
      showToast(`${res.deletedCount ?? 0} records removed`);
    } catch { showToast('Bulk delete failed'); }
  };

  /* ── Upload CSV ──────────────────────────────────────────────── */
  const handleUploadCSV = async () => {
    if (!file) { showToast('Select CSV first'); return; }
    try {
      setUploading(true);
      const res = await uploadCSV(file);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      showToast(`CSV uploaded — ${res.recordsCreated ?? 0} records`);
    } catch { showToast('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Page Header */}
      <div className="ff-page-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                <FaIndustry size={13} />
              </div>
              <p className="ff-label">Operations · Production</p>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.02em' }}>
              Production Records
            </h1>
            <p style={{ fontSize: 12, color: '#54546a', marginTop: 4 }}>
              Shop-floor data entry, management, and real-time monitoring
            </p>
          </div>
          <div className="flex items-center gap-2" style={{ fontSize: 10, color: '#54546a' }}>
            <FaCircle size={5} style={{ color: '#10b981' }} className="animate-[pulseDot_2s_ease-in-out_infinite]" />
            <span>Auto-refreshing every 10s</span>
          </div>
        </div>
      </div>

      {/* Add Record Form */}
      <div className="ff-card p-5">
        <p className="ff-label mb-3">Add Production Record</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="number" min="0" placeholder="Units Produced"
            value={units} onChange={(e) => setUnits(e.target.value)}
            className="ff-input"
          />
          <input
            type="number" min="0" placeholder="Defective Units"
            value={defects} onChange={(e) => setDefects(e.target.value)}
            className="ff-input"
          />
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="ff-select">
            <option value="">Select Product</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="ff-select">
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.department?.name})</option>
            ))}
          </select>
          <button onClick={handleAdd} className="ff-btn ff-btn-primary">Save Record</button>
        </div>
      </div>

      {/* Search + Upload */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex items-center gap-2 flex-1 rounded-xl px-3" style={{ background: '#17171c', border: '1px solid #2c2c38' }}>
          <SearchIcon style={{ color: '#54546a', fontSize: 18 }} />
          <input
            placeholder="Search by product or employee…"
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
          <button onClick={() => setShowClearModal(true)} className="ff-btn ff-btn-danger">
            <DeleteForeverIcon style={{ fontSize: 15 }} />
            Clear All
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && records.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ff-skeleton rounded-xl" style={{ height: 44 }} />
          ))}
        </div>
      )}

      {/* Table */}
      <ProductionTable records={filtered} onEdit={setEditData} onDelete={setDeleteId} />

      <EditProductionModal
        editData={editData} setEditData={setEditData}
        products={products} employees={employees}
        onUpdate={handleUpdate} onClose={() => setEditData(null)}
      />
      <DeleteProductionModal
        deleteId={deleteId} onDelete={handleDelete} onClose={() => setDeleteId(null)}
      />

      {showClearModal && (
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
              This will permanently delete <strong style={{ color: '#f0f0f4' }}>all production records</strong>.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowClearModal(false)} className="ff-btn ff-btn-secondary">Cancel</button>
              <button onClick={handleClearAll} className="ff-btn ff-btn-danger">Delete All</button>
            </div>
          </motion.div>
        </div>
      )}

      {toast && <div className="ff-toast">{toast}</div>}
    </motion.div>
  );
}
