'use client';

import { useEffect, useState, useMemo } from 'react';
import API from '@/lib/api';
import { motion } from 'framer-motion';
import { FaHistory, FaCircle } from 'react-icons/fa';

const ACTION_STYLES = {
  CREATE:    { label: 'CREATE',    bg: 'rgba(16,185,129,0.10)',  color: '#10b981'  },
  UPDATE:    { label: 'UPDATE',    bg: 'rgba(99,102,241,0.10)',  color: '#818cf8'  },
  DELETE:    { label: 'DELETE',    bg: 'rgba(244,63,94,0.10)',   color: '#f43f5e'  },
  PROMOTION: { label: 'PROMOTION', bg: 'rgba(168,85,247,0.10)', color: '#a855f7'  },
};

function ActionChip({ action }) {
  const s = ACTION_STYLES[action] ?? { bg: 'rgba(61,88,120,0.2)', color: '#9090a4' };
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '2px 8px', borderRadius: 6,
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
        background: s.bg, color: s.color,
      }}
    >
      {action}
    </span>
  );
}

function StatCard({ title, value, accent }) {
  const c = accent === 'blue' ? '#818cf8' : accent === 'amber' ? '#fbbf24' : accent === 'red' ? '#f43f5e' : '#f0f0f4';
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: '#17171c', border: '1px solid #1f1f28' }}
    >
      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#54546a', fontWeight: 600, marginBottom: 6 }}>
        {title}
      </p>
      <p style={{ fontSize: 24, fontWeight: 600, color: c, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    API.get('/audit-logs')
      .then((res) => setLogs(res.data || []))
      .catch(console.error);
  }, []);

  const today        = new Date().toDateString();
  const todayLogs    = useMemo(() => logs.filter((l) => new Date(l.timestamp).toDateString() === today), [logs]);
  const criticalLogs = useMemo(() => logs.filter((l) => ['DELETE', 'PROMOTION'].includes(l.action)), [logs]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Page Header */}
      <div className="ff-page-header">
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.08)', color: '#fbbf24' }}
          >
            <FaHistory size={13} />
          </div>
          <p className="ff-label">Governance · Compliance</p>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.02em' }}>
          System Audit Logs
        </h1>
        <p style={{ fontSize: 12, color: '#54546a', marginTop: 4 }}>
          Centralized monitoring of all critical database operations and state changes
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title="Total Audit Events"    value={logs.length}           accent="blue"  />
        <StatCard title="Activity Today"         value={todayLogs.length}      accent="amber" />
        <StatCard title="Critical Actions"        value={criticalLogs.length}   accent="red"   />
      </div>

      {/* Activity Timeline Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #1f1f28' }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Activity Timeline</p>
            <p style={{ fontSize: 11, color: '#54546a', marginTop: 2 }}>Complete audit trail of all system operations</p>
          </div>
          {logs.length > 0 && (
            <div className="flex items-center gap-2" style={{ fontSize: 10, color: '#54546a' }}>
              <FaCircle size={5} style={{ color: '#10b981' }} />
              <span>{logs.length} events</span>
            </div>
          )}
        </div>

        <div style={{ overflow: 'auto', maxHeight: 560 }}>
          <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 720 }}>
            <thead style={{ position: 'sticky', top: 0 }}>
              <tr style={{ background: 'rgba(10,22,40,0.95)', borderBottom: '1px solid #2c2c38' }}>
                {['Action', 'Entity', 'Entity ID', 'Performed By', 'Timestamp'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '11px 14px', textAlign: 'left',
                      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em',
                      fontWeight: 600, color: '#54546a',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  style={{ borderBottom: '1px solid #1f1f28', transition: 'background 150ms' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '11px 14px' }}>
                    <ActionChip action={log.action} />
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: '#f0f0f4' }}>
                    {log.entity}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#818cf8', fontFamily: 'JetBrains Mono, monospace' }}>
                    #{log.entityId}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 13, color: '#9090a4' }}>
                    {log.performedBy || 'System'}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 11, color: '#54546a', fontFamily: 'JetBrains Mono, monospace' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: 48, textAlign: 'center', color: '#54546a', fontSize: 13 }}>
                    No audit events recorded.
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
