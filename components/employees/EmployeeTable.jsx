'use client';

import React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const EmployeeTable = React.memo(({ employees, onEdit, onDelete }) => {
  if (!employees || employees.length === 0) {
    return (
      <div
        className="rounded-xl flex items-center justify-center py-16"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <div className="text-center">
          <p style={{ fontSize: 13, color: '#54546a' }}>No employees found</p>
          <p style={{ fontSize: 11, color: '#30303e', marginTop: 4 }}>Add employees or upload a CSV to get started</p>
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
        <table className="w-full text-left" style={{ minWidth: 820, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#17171c', borderBottom: '1px solid #2c2c38' }}>
              {['#', 'Employee Code', 'Name', 'Role', 'Department', 'Experience', 'Actions'].map((h) => (
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
            {employees.map((emp, i) => (
              <tr
                key={emp.id}
                style={{ borderBottom: '1px solid #1f1f28', background: '#17171c', transition: 'background 150ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#17171c'; }}
              >
                <td style={{ padding: '11px 14px', color: '#54546a', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                  {i + 1}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', fontFamily: 'JetBrains Mono, monospace' }}>
                    {emp.employeeCode}
                  </span>
                </td>
                <td style={{ padding: '11px 14px', color: '#f0f0f4', fontWeight: 500, fontSize: 13 }}>
                  {emp.name}
                </td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#9090a4' }}>
                  {emp.role?.title || '—'}
                </td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#9090a4' }}>
                  {emp.department?.name || '—'}
                </td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#9090a4' }}>
                  {emp.experience} yrs
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(emp)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition"
                      style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.15)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                    >
                      <EditIcon style={{ fontSize: 13 }} />
                    </button>
                    <button
                      onClick={() => onDelete(emp.id)}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer row count */}
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
          {employees.length} {employees.length === 1 ? 'record' : 'records'}
        </span>
      </div>
    </div>
  );
});

EmployeeTable.displayName = 'EmployeeTable';
export default EmployeeTable;
