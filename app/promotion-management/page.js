'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePromotionFlow } from '@/lib/hooks/usePromotionFlow';
import { FaUserTie, FaArrowRight, FaLock, FaTrophy, FaChevronUp } from 'react-icons/fa';

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

export default function PromotionManagement() {
  const [employeeId, setEmployeeId] = useState('');
  const [newRoleId,  setNewRoleId]  = useState('');
  const [remarks,    setRemarks]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState({ msg: '', type: 'success' });

  const {
    employees, roles, promotions,
    loading: dataLoading,
    promote, getValidRoles, isAtTopRole,
  } = usePromotionFlow();

  /* ── Derived ──────────────────────────────────────────────────── */
  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === Number(employeeId)),
    [employees, employeeId]
  );
  const validRoles = useMemo(
    () => getValidRoles(selectedEmployee),
    [getValidRoles, selectedEmployee]
  );
  const atTop    = useMemo(() => isAtTopRole(selectedEmployee), [isAtTopRole, selectedEmployee]);
  const newRole  = useMemo(() => roles.find((r) => r.id === Number(newRoleId)), [roles, newRoleId]);

  /* ── Toast ────────────────────────────────────────────────────── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  /* ── Submit ───────────────────────────────────────────────────── */
  const handlePromote = async () => {
    if (!employeeId || !newRoleId) return;
    setLoading(true);
    try {
      await promote({ employeeId: Number(employeeId), newRoleId: Number(newRoleId), remarks });
      showToast(`${selectedEmployee?.name} promoted to ${newRole?.title}`);
      setEmployeeId(''); setNewRoleId(''); setRemarks('');
    } catch (err) {
      showToast(err.message || 'Promotion failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && employeeId && newRoleId && !atTop;

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">

      {/* Page Header */}
      <motion.div variants={fadeUp} className="ff-page-header">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.08)', color: '#a855f7' }}>
            <FaUserTie size={13} />
          </div>
          <p className="ff-label">Governance · Promotions</p>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.02em' }}>
          Promotion Management
        </h1>
        <p style={{ fontSize: 12, color: '#54546a', marginTop: 4 }}>
          Structured role hierarchy progression · only valid upward moves allowed
        </p>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast.msg && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-4"
            style={{
              background: toast.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
              border:     toast.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(244,63,94,0.2)',
            }}
          >
            <p style={{ fontSize: 13, color: toast.type === 'success' ? '#10b981' : '#f87191', fontWeight: 500 }}>
              {toast.msg}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-6">

        {/* ── Promotion Form ─────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="rounded-xl p-5 space-y-4"
          style={{ background: '#17171c', border: '1px solid #1f1f28' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <FaChevronUp size={11} style={{ color: '#a855f7' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Process Promotion</p>
          </div>

          {/* Employee select */}
          <div>
            <label className="ff-label block mb-2">Select Employee</label>
            <select
              value={employeeId}
              onChange={(e) => { setEmployeeId(e.target.value); setNewRoleId(''); }}
              className="ff-select"
            >
              <option value="">Choose employee…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.role?.title ?? 'No Role'} (L{emp.role?.level})
                </option>
              ))}
            </select>
          </div>

          {/* Current role chip */}
          {selectedEmployee && (
            <div
              className="rounded-lg px-4 py-2.5 flex items-center justify-between"
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #2c2c38' }}
            >
              <div>
                <p style={{ fontSize: 10, color: '#54546a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Current Role</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#818cf8' }}>
                  {selectedEmployee.role?.title ?? 'None'}
                  {selectedEmployee.role?.level && (
                    <span style={{ fontSize: 10, color: '#54546a', marginLeft: 6 }}>Level {selectedEmployee.role.level}</span>
                  )}
                </p>
              </div>
              {atTop && (
                <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <FaTrophy size={9} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>Top Role</span>
                </div>
              )}
            </div>
          )}

          {/* Hierarchy-filtered role select */}
          <div>
            <label className="ff-label block mb-2">
              Promote To
              {selectedEmployee && !atTop && (
                <span style={{ fontSize: 10, color: '#54546a', marginLeft: 6 }}>
                  ({validRoles.length} valid positions above current level)
                </span>
              )}
            </label>
            {atTop ? (
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-2"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <FaLock size={10} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 12, color: '#f59e0b' }}>
                  Employee is already at the highest role in the hierarchy.
                </span>
              </div>
            ) : (
              <select
                value={newRoleId}
                onChange={(e) => setNewRoleId(e.target.value)}
                disabled={!selectedEmployee}
                className="ff-select"
                style={{ opacity: !selectedEmployee ? 0.5 : 1 }}
              >
                <option value="">
                  {!selectedEmployee ? 'Select an employee first' : 'Choose target role…'}
                </option>
                {validRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title} — Level {role.level}
                    {role.level === 1 ? ' (Top Management)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Transition preview */}
          {selectedEmployee && newRole && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg px-4 py-3 flex items-center gap-3"
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}
            >
              <span style={{ fontSize: 13, color: '#a855f7', fontWeight: 500 }}>
                {selectedEmployee.role?.title ?? 'No Role'}
              </span>
              <FaArrowRight size={10} style={{ color: '#a855f7', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#a855f7', fontWeight: 700 }}>
                {newRole.title}
              </span>
              <span
                className="ml-auto rounded-full px-2 py-0.5"
                style={{ fontSize: 9, fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                ↑ {(selectedEmployee.role?.level ?? 0) - newRole.level} Level{(selectedEmployee.role?.level ?? 0) - newRole.level !== 1 ? 's' : ''}
              </span>
            </motion.div>
          )}

          {/* Remarks */}
          <div>
            <label className="ff-label block mb-2">Remarks (optional)</label>
            <textarea
              placeholder="Enter promotion justification…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="ff-input"
              style={{ resize: 'none' }}
            />
          </div>

          <button
            onClick={handlePromote}
            disabled={!canSubmit}
            className="ff-btn ff-btn-primary"
            style={{ opacity: canSubmit ? 1 : 0.45, width: '100%', justifyContent: 'center' }}
          >
            {loading
              ? <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
              : <FaChevronUp size={11} />
            }
            Promote Employee
          </button>
        </motion.div>

        {/* ── Role hierarchy reference ───────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="rounded-xl overflow-hidden"
          style={{ background: '#17171c', border: '1px solid #1f1f28' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Role Hierarchy</p>
            <p style={{ fontSize: 11, color: '#54546a', marginTop: 2 }}>
              Level 1 = Top Management · Higher number = lower rank
            </p>
          </div>
          <div className="p-4 space-y-2 max-h-[340px] overflow-y-auto">
            {[...roles]
              .sort((a, b) => a.level - b.level)
              .map((role, i) => (
                <div
                  key={role.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{
                    background: role.level === 1
                      ? 'rgba(245,158,11,0.06)' : 'rgba(0,0,0,0.15)',
                    border: role.level === 1
                      ? '1px solid rgba(245,158,11,0.18)' : '1px solid #1f1f28',
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      fontSize: 9, fontWeight: 800,
                      fontFamily: 'JetBrains Mono, monospace',
                      background: role.level === 1 ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.08)',
                      color:      role.level === 1 ? '#f59e0b' : '#818cf8',
                    }}
                  >
                    L{role.level}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: role.level === 1 ? 700 : 500, color: role.level === 1 ? '#f0f0f4' : '#9090a4', flex: 1 }}>
                    {role.title}
                  </span>
                  {role.level === 1 && <FaTrophy size={9} style={{ color: '#f59e0b' }} />}
                </div>
              ))}
          </div>
        </motion.div>
      </div>

      {/* ── Promotion History ──────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl overflow-hidden"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Promotion History</p>
            <p style={{ fontSize: 11, color: '#54546a', marginTop: 2 }}>Complete audit trail of all role progressions</p>
          </div>
          {promotions.length > 0 && (
            <span className="ff-badge ff-badge-ghost">{promotions.length} records</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ background: '#17171c', borderBottom: '1px solid #2c2c38' }}>
                {['Employee', 'From Role', 'To Role', 'Levels Gained', 'Date'].map((h) => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 600, color: '#54546a' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataLoading && promotions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px 14px' }}>
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="ff-skeleton rounded-lg" style={{ height: 32 }} />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#54546a' }}>
                    No promotions recorded yet.
                  </td>
                </tr>
              ) : (
                promotions.map((p) => {
                  const levelsGained = (p.oldRole?.level ?? 0) - (p.newRole?.level ?? 0);
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '1px solid #1f1f28', transition: 'background 150ms', opacity: p._optimistic ? 0.7 : 1 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: '#f0f0f4' }}>
                        {p.employee?.name ?? '—'}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#9090a4' }}>
                        {p.oldRole?.title ?? '—'}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#a855f7' }}>
                          {p.newRole?.title ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        {levelsGained > 0 && (
                          <span
                            className="rounded-full px-2 py-0.5"
                            style={{ fontSize: 10, fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                          >
                            +{levelsGained}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 11, color: '#54546a', fontFamily: 'JetBrains Mono, monospace' }}>
                        {p.promotedAt ? new Date(p.promotedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

    </motion.div>
  );
}
