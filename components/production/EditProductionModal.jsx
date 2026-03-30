'use client';

import { motion } from 'framer-motion';

export default function EditProductionModal({ editData, setEditData, products, employees, onUpdate, onClose }) {
  if (!editData) return null;

  const selectedProduct = products.find((p) => p.id === Number(editData.productId));
  const unitPrice       = selectedProduct?.unitPrice || 0;
  const units           = Number(editData.units)     || 0;
  const revenue         = units * unitPrice;

  return (
    <div className="ff-modal-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="ff-modal"
        style={{ maxWidth: 520 }}
      >
        <div className="mb-5">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f4', marginBottom: 6 }}>
            Edit Production Record
          </h3>
          <div style={{ fontSize: 12, color: '#30303e', lineHeight: 1.8 }}>
            <span>Product: </span>
            <span style={{ color: '#9090a4', fontWeight: 500 }}>{editData.product?.name}</span>
            <span> · Employee: </span>
            <span style={{ color: '#9090a4', fontWeight: 500 }}>{editData.employee?.name}</span>
            <span> · Dept: </span>
            <span style={{ color: '#9090a4', fontWeight: 500 }}>{editData.employee?.department?.name}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ff-label block mb-1.5">Units Produced</label>
              <input
                type="number"
                value={editData.units}
                onChange={(e) => setEditData({ ...editData, units: e.target.value })}
                className="ff-input"
              />
            </div>
            <div>
              <label className="ff-label block mb-1.5">Defective Units</label>
              <input
                type="number"
                value={editData.defects}
                onChange={(e) => setEditData({ ...editData, defects: e.target.value })}
                className="ff-input"
              />
            </div>
          </div>

          <div>
            <label className="ff-label block mb-1.5">Product</label>
            <select
              value={editData.productId}
              onChange={(e) => setEditData({ ...editData, productId: Number(e.target.value) })}
              className="ff-select"
            >
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="ff-label block mb-1.5">Employee</label>
            <select
              value={editData.employeeId}
              onChange={(e) => setEditData({ ...editData, employeeId: Number(e.target.value) })}
              className="ff-select"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.department?.name})</option>
              ))}
            </select>
          </div>

          {/* Revenue preview */}
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1f1f28' }}
          >
            <div>
              <p className="ff-label mb-1">Unit Price</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#9090a4', fontFamily: 'JetBrains Mono, monospace' }}>
                ₹{unitPrice.toLocaleString()}
              </p>
            </div>
            <div style={{ width: 1, height: 36, background: '#1f1f28' }} />
            <div>
              <p className="ff-label mb-1">Revenue Impact</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
                ₹{revenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="ff-btn ff-btn-secondary">Cancel</button>
          <button onClick={onUpdate} className="ff-btn ff-btn-success">Update Record</button>
        </div>
      </motion.div>
    </div>
  );
}
