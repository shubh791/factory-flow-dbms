'use client';

import { useEffect, useState } from 'react';
import API from '@/lib/api';
import { motion } from 'framer-motion';
import { FaUserShield, FaTrash } from 'react-icons/fa';

const LEVEL_STYLES = [
  { bg: 'rgba(99,102,241,0.10)',  color: '#818cf8',  label: 'Entry Level'      },
  { bg: 'rgba(168,85,247,0.10)', color: '#a855f7',  label: 'Operational Staff' },
  { bg: 'rgba(16,185,129,0.10)', color: '#10b981',  label: 'Senior Staff'      },
  { bg: 'rgba(251,191,36,0.10)', color: '#fbbf24',  label: 'Supervisory Level' },
  { bg: 'rgba(245,158,11,0.10)', color: '#e8960a',  label: 'Management Level'  },
];

function getLevelStyle(level) {
  return LEVEL_STYLES[Math.min(level - 1, LEVEL_STYLES.length - 1)] ?? LEVEL_STYLES[0];
}

function getLevelLabel(level) {
  const labels = {
    1: 'Entry Level', 2: 'Operational Staff', 3: 'Senior Staff',
    4: 'Supervisory Level', 5: 'Management Level',
  };
  return level >= 6 ? 'Executive Level' : labels[level] ?? 'Custom Level';
}

export default function RoleManagement() {
  const [roles,   setRoles]   = useState([]);
  const [title,   setTitle]   = useState('');
  const [level,   setLevel]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadRoles(); }, []);

  const loadRoles = async () => {
    try {
      const res = await API.get('/roles');
      setRoles(res.data.sort((a, b) => a.level - b.level));
    } catch { console.error('Failed to load roles'); }
  };

  const handleCreate = async () => {
    if (!title || !level) return;
    if (roles.some((r) => r.level === Number(level))) {
      alert('This hierarchy level already exists.');
      return;
    }
    setLoading(true);
    try {
      await API.post('/roles', { title: title.trim(), level: Number(level) });
      setTitle(''); setLevel(''); loadRoles();
    } catch { alert('Role creation failed'); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await API.delete(`/roles/${id}`); loadRoles();
    } catch { alert('Cannot delete role. It may be assigned to employees.'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Page Header */}
      <div className="ff-page-header">
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8' }}
          >
            <FaUserShield size={13} />
          </div>
          <p className="ff-label">Governance · Role Registry</p>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.02em' }}>
          Role & Hierarchy Management
        </h1>
        <p style={{ fontSize: 12, color: '#54546a', marginTop: 4 }}>
          Define structured organizational role levels for enterprise governance
        </p>
      </div>

      {/* Create Form */}
      <div
        className="rounded-xl p-5 space-y-4 max-w-lg"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4', marginBottom: 2 }}>Create New Role</p>

        <div>
          <label className="ff-label block mb-2">Role Title</label>
          <input
            placeholder="e.g. Senior Operator"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="ff-input"
          />
        </div>

        <div>
          <label className="ff-label block mb-2">Hierarchy Level</label>
          <input
            type="number"
            placeholder="e.g. 3"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="ff-input"
          />
          <p style={{ fontSize: 10, color: '#30303e', marginTop: 5 }}>
            Lower number = lower position in hierarchy
          </p>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !title || !level}
          className="ff-btn ff-btn-primary"
          style={{ opacity: (!title || !level) ? 0.5 : 1 }}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
          ) : null}
          Create Role
        </button>
      </div>

      {/* Hierarchy Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Organizational Hierarchy</p>
          <p style={{ fontSize: 11, color: '#54546a', marginTop: 2 }}>
            {roles.length} {roles.length === 1 ? 'role' : 'roles'} defined
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ background: '#17171c', borderBottom: '1px solid #2c2c38' }}>
                {['Level', 'Designation', 'Position', 'Action'].map((h) => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 600, color: '#54546a' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => {
                const st = getLevelStyle(role.level);
                return (
                  <tr
                    key={role.id}
                    style={{ borderBottom: '1px solid #1f1f28', transition: 'background 150ms' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '11px 14px' }}>
                      <span
                        style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '2px 9px', borderRadius: 6,
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                          background: st.bg, color: st.color,
                        }}
                      >
                        L{role.level}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>{role.title}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#9090a4' }}>{getLevelLabel(role.level)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition"
                        style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.15)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.18)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; }}
                      >
                        <FaTrash size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {roles.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#54546a' }}>
                    No roles defined. Create one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </motion.div>
  );
}
