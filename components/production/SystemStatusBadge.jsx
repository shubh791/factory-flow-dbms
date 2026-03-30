'use client';

import { FaCircle } from 'react-icons/fa';

const STATUS_MAP = {
  Operational: {
    color:  '#10b981',
    bg:     'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    label:  'Operational',
  },
  Risk: {
    color:  '#f59e0b',
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    label:  'Performance Risk',
  },
  Critical: {
    color:  '#f43f5e',
    bg:     'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.2)',
    label:  'Critical Condition',
  },
};

export default function SystemStatusBadge({ status }) {
  const cfg = STATUS_MAP[status] ?? {
    color: '#9090a4', bg: 'rgba(144,144,164,0.08)', border: 'rgba(144,144,164,0.2)', label: 'Unknown',
  };

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg flex-shrink-0"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <FaCircle size={5} style={{ color: cfg.color }} className="animate-[pulseDot_2s_ease-in-out_infinite]" />
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}
