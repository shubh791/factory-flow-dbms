'use client';

import { motion } from 'framer-motion';
import { FaExclamationTriangle } from 'react-icons/fa';

const DeleteEmployeeModal = ({ deleteId, onDelete, onClose }) => {
  if (!deleteId) return null;

  return (
    <div className="ff-modal-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="ff-modal"
        style={{ maxWidth: 380 }}
      >
        <div className="flex items-start gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(244,63,94,0.10)', color: '#f43f5e' }}
          >
            <FaExclamationTriangle size={14} />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f4', marginBottom: 4 }}>
              Confirm Delete
            </h3>
            <p style={{ fontSize: 13, color: '#9090a4', lineHeight: 1.6 }}>
              This employee record will be permanently removed. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="ff-btn ff-btn-secondary">Cancel</button>
          <button onClick={onDelete} className="ff-btn ff-btn-danger">Delete</button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteEmployeeModal;
