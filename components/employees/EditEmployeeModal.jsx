'use client';

import { motion } from 'framer-motion';

const EditEmployeeModal = ({ editData, setEditData, departments, onUpdate, onClose }) => {
  if (!editData) return null;

  return (
    <div className="ff-modal-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="ff-modal"
      >
        <div className="mb-5">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f4', marginBottom: 4 }}>
            Edit Employee Record
          </h3>
          <p style={{ fontSize: 12, color: '#54546a' }}>
            Updating:{' '}
            <span style={{ color: '#818cf8', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
              {editData.employeeCode}
            </span>{' '}
            — {editData.name}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="ff-label block mb-1.5">Employee Code</label>
            <input
              value={editData.employeeCode || ''}
              onChange={(e) => setEditData({ ...editData, employeeCode: e.target.value })}
              className="ff-input"
            />
          </div>
          <div>
            <label className="ff-label block mb-1.5">Full Name</label>
            <input
              value={editData.name || ''}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="ff-input"
            />
          </div>
          <div>
            <label className="ff-label block mb-1.5">Experience (Years)</label>
            <input
              type="number"
              value={editData.experience || ''}
              onChange={(e) => setEditData({ ...editData, experience: e.target.value })}
              className="ff-input"
            />
          </div>
          <div>
            <label className="ff-label block mb-1.5">Department</label>
            <select
              value={editData.departmentId || ''}
              onChange={(e) => setEditData({ ...editData, departmentId: e.target.value })}
              className="ff-select"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="ff-btn ff-btn-secondary">Cancel</button>
          <button onClick={onUpdate} className="ff-btn ff-btn-primary">Update Employee</button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditEmployeeModal;
