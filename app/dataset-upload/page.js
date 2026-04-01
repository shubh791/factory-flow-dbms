'use client';

import { useState, useCallback, useRef } from 'react';
import { FaUpload, FaFileCsv, FaCheckCircle, FaExclamationTriangle, FaDatabase, FaUsers, FaIndustry, FaTimes, FaDownload, FaPlay } from 'react-icons/fa';
import API from '@/lib/api';

const FIELD_LABELS = {
  // Employee
  name: 'Employee Name', employeeCode: 'Employee Code', email: 'Email',
  phone: 'Phone', experience: 'Experience (yrs)', department: 'Department',
  role: 'Role', status: 'Status',
  // Production
  product: 'Product Name', units: 'Units Produced', defects: 'Defects',
  shift: 'Shift', employee: 'Employee', date: 'Production Date',
};

export default function DatasetUploadPage() {
  const [step, setStep] = useState(1); // 1=upload, 2=mapping, 3=done
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [mapping, setMapping] = useState({});
  const [importType, setImportType] = useState('auto');
  const [defaultDeptId, setDefaultDeptId] = useState('');
  const [defaultRoleId, setDefaultRoleId] = useState('');
  const [defaultProductId, setDefaultProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const readFile = (file) => {
    if (!file || !file.name.match(/\.csv$/i)) {
      alert('Please upload a CSV file (.csv)');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setCsvText(e.target.result);
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    readFile(e.dataTransfer.files[0]);
  }, []);

  const analyze = async () => {
    if (!csvText) return;
    setLoading(true);
    try {
      const res = await API.post('/datasets/smart-import', {
        csvText,
        importType: importType === 'auto' ? undefined : importType,
      });
      setAnalysis(res.data);
      setMapping(res.data.columnMapping);
      if (res.data.meta?.departments?.[0]) setDefaultDeptId(String(res.data.meta.departments[0].id));
      if (res.data.meta?.roles?.[0])       setDefaultRoleId(String(res.data.meta.roles[0].id));
      if (res.data.meta?.products?.[0])    setDefaultProductId(String(res.data.meta.products[0].id));
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const runImport = async () => {
    setLoading(true);
    try {
      const res = await API.put('/datasets/smart-import', {
        csvText,
        importType: analysis.detectedType,
        columnMapping: mapping,
        defaultDeptId,
        defaultRoleId,
        defaultProductId,
      });
      setResult(res.data);
      setStep(3);
    } catch (err) {
      alert(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1); setCsvText(''); setFileName(''); setAnalysis(null);
    setMapping({}); setResult(null); setImportType('auto');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Smart Dataset Import</h1>
        <p className="text-sm text-[var(--text-secondary)]">Upload any CSV from Kaggle or any source — AI auto-maps columns to your database schema</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {[['1', 'Upload CSV'], ['2', 'Map Columns'], ['3', 'Done']].map(([n, label], i) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= Number(n) ? 'bg-[var(--color-info)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>{n}</div>
            <span className={`text-xs font-medium ${step >= Number(n) ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{label}</span>
            {i < 2 && <div className="w-8 h-px bg-[var(--border-primary)]" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Upload */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Import type selector */}
          <div className="industrial-card-elevated p-4">
            <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Import Type</div>
            <div className="flex gap-3">
              {[['auto', FaDatabase, 'Auto Detect'], ['employee', FaUsers, 'Employee Data'], ['production', FaIndustry, 'Production Data']].map(([val, Icon, label]) => (
                <button
                  key={val}
                  onClick={() => setImportType(val)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${importType === val ? 'border-[var(--color-info)] bg-[var(--color-info)]/10 text-[var(--color-info)]' : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--color-info)]/50'}`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`industrial-card-elevated p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center ${dragOver ? 'border-[var(--color-info)] bg-[var(--color-info)]/5' : 'border-[var(--border-primary)] hover:border-[var(--color-info)]/50'}`}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => readFile(e.target.files[0])} />
            <FaFileCsv size={40} className="mx-auto mb-4 text-[var(--color-info)]" />
            {csvText ? (
              <div>
                <div className="text-base font-semibold text-[var(--text-primary)] mb-1">{fileName}</div>
                <div className="text-xs text-[var(--color-success)]">✓ File loaded — click Analyze to continue</div>
              </div>
            ) : (
              <div>
                <div className="text-base font-semibold text-[var(--text-primary)] mb-2">Drop CSV file here or click to browse</div>
                <div className="text-xs text-[var(--text-muted)]">Supports any CSV — Kaggle datasets, Excel exports, custom files</div>
              </div>
            )}
          </div>

          {/* Example formats */}
          <div className="industrial-card p-4">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Supported Column Names (examples)</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2"><FaUsers size={11} className="text-[var(--color-info)]" /><span className="text-xs font-semibold text-[var(--text-secondary)]">Employee CSV</span></div>
                <div className="text-[11px] text-[var(--text-muted)] space-y-0.5">
                  <div>name, full_name, employee_name</div>
                  <div>code, emp_id, employee_code</div>
                  <div>email, department, role, experience</div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><FaIndustry size={11} className="text-[var(--color-info)]" /><span className="text-xs font-semibold text-[var(--text-secondary)]">Production CSV</span></div>
                <div className="text-[11px] text-[var(--text-muted)] space-y-0.5">
                  <div>product, item, goods</div>
                  <div>units, quantity, output</div>
                  <div>defects, shift, date, employee</div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={analyze}
            disabled={!csvText || loading}
            className="btn-industrial btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaDatabase size={14} />}
            {loading ? 'Analyzing...' : 'Analyze & Map Columns'}
          </button>
        </div>
      )}

      {/* STEP 2: Mapping */}
      {step === 2 && analysis && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="industrial-card-elevated p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${analysis.detectedType === 'employee' ? 'bg-[var(--color-info)]/10' : 'bg-green-500/10'}`}>
              {analysis.detectedType === 'employee' ? <FaUsers size={18} className="text-[var(--color-info)]" /> : <FaIndustry size={18} className="text-green-500" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[var(--text-primary)] capitalize">{analysis.detectedType} Import Detected</div>
              <div className="text-xs text-[var(--text-secondary)]">{analysis.totalRows} rows · {analysis.headers.length} columns in <span className="font-mono">{fileName}</span></div>
            </div>
            <button onClick={reset} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1"><FaTimes size={10} /> Change file</button>
          </div>

          {/* Column mapping */}
          <div className="industrial-card-elevated p-4">
            <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Column Mapping</div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(mapping).map(([field, col]) => (
                <div key={field} className="flex items-center gap-2">
                  <div className="text-xs text-[var(--text-secondary)] w-28 flex-shrink-0">{FIELD_LABELS[field] || field}</div>
                  <select
                    value={col || ''}
                    onChange={e => setMapping(m => ({ ...m, [field]: e.target.value || null }))}
                    className="select-industrial flex-1 text-xs py-1.5"
                  >
                    <option value="">-- skip --</option>
                    {analysis.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Defaults */}
          {analysis.detectedType === 'employee' && analysis.meta && (
            <div className="industrial-card-elevated p-4">
              <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Defaults (used when column is missing)</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Default Department</div>
                  <select value={defaultDeptId} onChange={e => setDefaultDeptId(e.target.value)} className="select-industrial text-xs py-1.5">
                    {analysis.meta.departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Default Role</div>
                  <select value={defaultRoleId} onChange={e => setDefaultRoleId(e.target.value)} className="select-industrial text-xs py-1.5">
                    {analysis.meta.roles?.map(r => <option key={r.id} value={r.id}>{r.title} (L{r.level})</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {analysis.detectedType === 'production' && analysis.meta?.products && (
            <div className="industrial-card-elevated p-4">
              <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Default Product (when not found in CSV)</div>
              <select value={defaultProductId} onChange={e => setDefaultProductId(e.target.value)} className="select-industrial text-xs py-1.5">
                {analysis.meta.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {/* Preview table */}
          <div className="industrial-card-elevated p-4">
            <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Data Preview (first 5 rows)</div>
            <div className="overflow-x-auto">
              <table className="table-industrial text-xs">
                <thead>
                  <tr>
                    {Object.keys(mapping).filter(f => mapping[f]).map(f => <th key={f}>{FIELD_LABELS[f] || f}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {analysis.preview.map((row, i) => (
                    <tr key={i}>
                      {Object.keys(mapping).filter(f => mapping[f]).map(f => (
                        <td key={f}>{row.mapped[f] || <span className="text-[var(--text-muted)]">—</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-industrial btn-secondary flex-1">← Back</button>
            <button onClick={runImport} disabled={loading} className="btn-industrial btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaPlay size={12} />}
              {loading ? 'Importing...' : `Import ${analysis.totalRows} Rows`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Done */}
      {step === 3 && result && (
        <div className="industrial-card-elevated p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <FaCheckCircle size={32} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Import Complete!</h2>
            <p className="text-sm text-[var(--text-secondary)]">{result.message}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <div className="kpi-card px-6">
              <div className="kpi-label">Imported</div>
              <div className="kpi-value text-[var(--color-success)]">{result.imported}</div>
            </div>
            <div className="kpi-card px-6">
              <div className="kpi-label">Skipped</div>
              <div className="kpi-value text-[var(--color-warning)]">{result.skipped}</div>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="text-left bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 rounded-lg p-3">
              <div className="text-xs font-semibold text-[var(--color-danger)] mb-2">Errors ({result.errors.length})</div>
              {result.errors.map((e, i) => <div key={i} className="text-xs text-[var(--text-secondary)]">{e}</div>)}
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="btn-industrial btn-secondary">Import Another File</button>
            <a href={analysis?.detectedType === 'employee' ? '/employees' : '/production'} className="btn-industrial btn-primary">View Imported Data →</a>
          </div>
        </div>
      )}
    </div>
  );
}
