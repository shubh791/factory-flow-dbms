'use client';

import React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const ProductionTable = React.memo(({ records, onEdit, onDelete }) => {
  if (!records || records.length === 0) {
    return (
      <div
        className="rounded-xl flex items-center justify-center py-16"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <div className="text-center">
          <p style={{ fontSize: 13, color: '#54546a' }}>No production records found</p>
          <p style={{ fontSize: 11, color: '#30303e', marginTop: 4 }}>Add records manually or upload a CSV file</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid #1f1f28' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ minWidth: 900, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#17171c', borderBottom: '1px solid #2c2c38' }}>
              {['#', 'Product', 'Employee', 'Department', 'Units', 'Defects', 'Revenue', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '11px 14px',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.09em',
                    fontWeight: 600,
                    color: '#54546a',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {records.map((rec, index) => {
              const units   = Number(rec.units)   || 0;
              const defects = Number(rec.defects) || 0;

              return (
                <tr
                  key={rec.id}
                  style={{ borderBottom: '1px solid #1f1f28', background: '#17171c', transition: 'background 150ms' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#17171c'; }}
                >
                  <td style={{ padding: '11px 14px', color: '#54546a', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: '11px 14px', color: '#f0f0f4', fontWeight: 500, fontSize: 13 }}>
                    {rec.product?.name || '—'}
                  </td>
                  <td style={{ padding: '11px 14px', color: '#9090a4', fontSize: 13 }}>
                    {rec.employee?.name || '—'}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#9090a4' }}>
                    {rec.employee?.department?.name || '—'}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: '#f0f0f4', fontWeight: 500 }}>
                    {units.toLocaleString()}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: defects > 0 ? '#f43f5e' : '#54546a' }}>
                    {defects.toLocaleString()}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#10b981' }}>
                    ₹{(rec.revenue || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(rec)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition"
                        style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.15)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                      >
                        <EditIcon style={{ fontSize: 13 }} />
                      </button>
                      <button
                        onClick={() => onDelete(rec.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition"
                        style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.15)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.18)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; }}
                      >
                        <DeleteIcon style={{ fontSize: 13 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          borderTop: '1px solid #1f1f28',
          padding: '10px 14px',
          background: 'rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <span style={{ fontSize: 10, color: '#54546a', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {records.length} {records.length === 1 ? 'record' : 'records'}
        </span>
      </div>
    </div>
  );
});

ProductionTable.displayName = 'ProductionTable';
export default ProductionTable;
