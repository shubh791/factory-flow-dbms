'use client';

import { useState, useCallback, useRef } from 'react';
import {
  FaFileCsv, FaCheckCircle, FaDatabase, FaUsers, FaIndustry,
  FaTimes, FaPlay, FaCalendarAlt, FaBoxOpen, FaChevronDown,
  FaLink, FaBan, FaSearch, FaPlus, FaArrowRight, FaExchangeAlt,
} from 'react-icons/fa';
import API from '@/lib/api';

const FIELD_LABELS = {
  name: 'Employee Name', employeeCode: 'Employee Code', email: 'Email',
  phone: 'Phone', experience: 'Experience (yrs)', department: 'Department',
  role: 'Role', status: 'Status',
  product: 'Product Name', units: 'Units Produced', defects: 'Defects',
  shift: 'Shift', employee: 'Employee', date: 'Production Date',
};

const SHIFT_COLORS = {
  MORNING: ['#fbbf24', 'rgba(245,158,11,0.12)', 'rgba(245,158,11,0.25)'],
  EVENING: ['#818cf8', 'rgba(99,102,241,0.12)', 'rgba(99,102,241,0.25)'],
  NIGHT:   ['#c084fc', 'rgba(168,85,247,0.12)', 'rgba(168,85,247,0.25)'],
};

const ENTITY_FIELDS = ['product', 'employee', 'department', 'role'];

function getItemName(item, field) {
  if (!item) return '';
  if (field === 'role') return item.title || item.name || '';
  if (field === 'employee') return item.name ? `${item.name} (${item.employeeCode})` : item.employeeCode || '';
  return item.name || '';
}

function getDbItems(analysis, field) {
  if (!analysis?.dbData) return [];
  const key = field === 'role' ? 'roles' : field === 'employee' ? 'employees'
    : field === 'department' ? 'departments' : 'products';
  return analysis.dbData[key] || [];
}

export default function DatasetUploadPage() {
  const [step, setStep] = useState(1);
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [mapping, setMapping] = useState({});
  const [importType, setImportType] = useState('auto');
  const [defaultDeptId, setDefaultDeptId] = useState('');
  const [defaultRoleId, setDefaultRoleId] = useState('');
  const [defaultProductId, setDefaultProductId] = useState('');
  const [defaultDate, setDefaultDate] = useState(new Date().toISOString().slice(0, 10));
  const [defaultUnits, setDefaultUnits] = useState('100');
  const [defaultDefects, setDefaultDefects] = useState('0');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [valueMappings, setValueMappings] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const fileRef = useRef();

  const readFile = (file) => {
    if (!file || !file.name.match(/\.csv$/i)) { alert('Please upload a CSV file (.csv)'); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setCsvText(e.target.result);
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false); readFile(e.dataTransfer.files[0]);
  }, []);

  const analyze = async (forceType) => {
    if (!csvText) return;
    setLoading(true);
    try {
      const type = forceType ?? (importType === 'auto' ? undefined : importType);
      const res = await API.post('/datasets/smart-import', { csvText, importType: type });
      const data = res.data;
      setAnalysis(data);

      // Flat mapping: { field: csvColName | null }
      const flat = {};
      Object.entries(data.columnMapping || {}).forEach(([f, info]) => {
        flat[f] = info.csvCol || null;
      });
      setMapping(flat);

      // Defaults from dbData
      if (data.dbData?.departments?.[0]) setDefaultDeptId(String(data.dbData.departments[0].id));
      if (data.dbData?.roles?.[0])       setDefaultRoleId(String(data.dbData.roles[0].id));
      if (data.dbData?.products?.[0])    setDefaultProductId(String(data.dbData.products[0].id));

      // Auto-init valueMappings from valueSuggestions
      const initVM = {};
      ENTITY_FIELDS.forEach(field => {
        const suggestions = data.valueSuggestions?.[field] || {};
        const unique = data.uniqueValues?.[field] || [];
        if (!unique.length) return;
        initVM[field] = {};
        unique.forEach(val => {
          const sug = suggestions[val];
          if (sug) {
            initVM[field][val] = { action: 'map', mappedId: sug.id };
          } else {
            initVM[field][val] = { action: 'new', newName: val };
          }
        });
      });
      setValueMappings(initVM);
      setSearchTerms({});
      setShowSummary(false);
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
        valueMappings,
        defaultDeptId,
        defaultRoleId,
        defaultProductId,
        defaultDate,
        defaultUnits:   Number(defaultUnits)  || 0,
        defaultDefects: Number(defaultDefects) || 0,
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
    setValueMappings({}); setSearchTerms({}); setShowSummary(false);
  };

  const setVM = (field, csvVal, patch) =>
    setValueMappings(prev => ({
      ...prev,
      [field]: { ...prev[field], [csvVal]: { ...prev[field]?.[csvVal], ...patch } },
    }));

  const setST = (field, csvVal, term) =>
    setSearchTerms(prev => ({ ...prev, [field]: { ...prev[field], [csvVal]: term } }));

  /* ─────────────────────────────────────────────────────────────────── */

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Smart Dataset Import</h1>
        <p className="text-sm text-[var(--text-secondary)]">Upload any CSV — AI auto-maps columns and resolves values against your database</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {[['1', 'Upload CSV'], ['2', 'Map & Review'], ['3', 'Done']].map(([n, label], i) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= Number(n) ? 'bg-[var(--color-info)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>{n}</div>
            <span className={`text-xs font-medium ${step >= Number(n) ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{label}</span>
            {i < 2 && <div className="w-8 h-px bg-[var(--border-primary)]" />}
          </div>
        ))}
      </div>

      {/* ─── STEP 1: Upload ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="industrial-card-elevated p-4">
            <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Import Type</div>
            <div className="flex gap-3">
              {[['auto', FaDatabase, 'Auto Detect'], ['employee', FaUsers, 'Employee Data'], ['production', FaIndustry, 'Production Data']].map(([val, Icon, label]) => (
                <button key={val} onClick={() => setImportType(val)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${importType === val ? 'border-[var(--color-info)] bg-[var(--color-info)]/10 text-[var(--color-info)]' : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--color-info)]/50'}`}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>
          </div>

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

          <button onClick={() => analyze()} disabled={!csvText || loading}
            className="btn-industrial btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaDatabase size={14} />}
            {loading ? 'Analyzing...' : 'Analyze & Map Columns'}
          </button>
        </div>
      )}

      {/* ─── STEP 2: Map & Review ────────────────────────────────────────── */}
      {step === 2 && analysis && (() => {
        const isProd = analysis.detectedType === 'production';
        const score  = analysis.detectionScore ?? 0;
        const scoreColor = score >= 85 ? '#34d399' : score >= 65 ? '#fbbf24' : '#fb7185';

        const allFields    = Object.keys(mapping);
        const visibleFields = allFields.filter(f => !(isProd && f === 'date'));
        const mappedCount  = visibleFields.filter(f => mapping[f]).length;

        const handleMappingChange = (field, newCol) => {
          setMapping(prev => {
            const next = { ...prev };
            if (newCol) Object.keys(next).forEach(k => { if (k !== field && next[k] === newCol) next[k] = null; });
            next[field] = newCol || null;
            return next;
          });
        };

        // Entity fields that have values to reconcile AND a mapped CSV column
        const reconFields = ENTITY_FIELDS.filter(f => {
          const vals = valueMappings[f];
          return vals && Object.keys(vals).length > 0 && mapping[f];
        });

        // Pre-import summary counts
        const summaryStats = (() => {
          let newRecs = 0, willSkip = 0, mapped = 0;
          ENTITY_FIELDS.forEach(f => {
            Object.values(valueMappings[f] || {}).forEach(vm => {
              if (vm.action === 'new')  { newRecs++; mapped++; }
              else if (vm.action === 'map')  mapped++;
              else if (vm.action === 'skip') willSkip++;
            });
          });
          return { mapped, newRecs, willSkip, total: analysis.totalRows };
        })();

        return (
          <div className="space-y-5">

            {/* ── File summary bar ── */}
            <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isProd ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                {isProd ? <FaIndustry size={16} className="text-emerald-400" /> : <FaUsers size={16} className="text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm capitalize" style={{ color: '#f0f0f4' }}>{analysis.detectedType} Dataset</div>
                <div className="text-xs mt-0.5" style={{ color: '#54546a' }}>
                  <span style={{ color: '#818cf8', fontFamily: 'monospace' }}>{fileName}</span>
                  &nbsp;·&nbsp;{analysis.totalRows} rows&nbsp;·&nbsp;{analysis.headers.length} columns
                </div>
              </div>
              <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.18)', cursor: 'pointer' }}>
                <FaTimes size={9} /> Change file
              </button>
            </div>

            {/* ── Detection confidence banner ── */}
            <div className="rounded-xl p-4" style={{ background: '#17171c', border: `1px solid ${scoreColor}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${scoreColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isProd ? <FaIndustry size={16} style={{ color: scoreColor }} /> : <FaUsers size={16} style={{ color: scoreColor }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#f0f0f4', textTransform: 'capitalize' }}>
                    {analysis.detectedType} Dataset Detected
                  </div>
                  <div style={{ fontSize: 11, color: '#54546a', marginTop: 2 }}>
                    Detection confidence:&nbsp;
                    <span style={{ color: scoreColor, fontWeight: 700 }}>{score}%</span>
                    &nbsp;—&nbsp;{score >= 85 ? 'High confidence' : score >= 65 ? 'Moderate confidence' : 'Low confidence, consider overriding'}
                  </div>
                </div>
                {/* Switch type button */}
                {['production', 'employee'].filter(t => t !== analysis.detectedType).map(t => (
                  <button key={t} onClick={() => analyze(t)} disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '5px 12px', borderRadius: 7, background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer' }}>
                    <FaExchangeAlt size={9} /> Switch to {t}
                  </button>
                ))}
              </div>
              <div style={{ height: 4, borderRadius: 99, background: '#1f1f28', overflow: 'hidden' }}>
                <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </div>

            {/* ── 3-column mapping table ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
              {/* Header */}
              <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1f1f28', background: 'rgba(99,102,241,0.04)' }}>
                <FaLink size={11} style={{ color: '#818cf8' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#818cf8' }}>Column Mapping</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 10px', borderRadius: 99, background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                  {mappedCount} / {visibleFields.length} mapped
                </span>
              </div>

              {/* Table column labels */}
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 160px', background: '#0c0c10', borderBottom: '1px solid #1f1f28', padding: '8px 20px', gap: 12 }}>
                {['DB Field', 'CSV Column', 'Sample Values'].map(h => (
                  <span key={h} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3a3a5a' }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {visibleFields.map((field, idx) => {
                const col      = mapping[field];
                const isMapped = !!col;
                const isNum    = ['units', 'defects', 'experience'].includes(field);
                const isShift  = field === 'shift';
                const isLinked = ENTITY_FIELDS.includes(field);
                const colInfo  = analysis.columnMapping?.[field];

                // Sample values from preview
                const samples = col
                  ? [...new Set(analysis.preview.map(r => r.mapped?.[field] || r.original?.[col]).filter(Boolean))].slice(0, 4)
                  : [];

                return (
                  <div key={field} style={{
                    display: 'grid', gridTemplateColumns: '180px 1fr 160px', gap: 12,
                    padding: '12px 20px', alignItems: 'center',
                    borderBottom: idx < visibleFields.length - 1 ? '1px solid #1a1a24' : 'none',
                    background: isMapped ? 'rgba(16,185,129,0.015)' : 'transparent',
                  }}>
                    {/* Col 1: DB Field */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isMapped ? '#e2e8f0' : '#54546a', marginBottom: 4 }}>
                        {FIELD_LABELS[field] || field}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {isNum && <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(99,102,241,0.1)', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>NUM</span>}
                        {isLinked && <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(6,182,212,0.1)', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.06em' }}>DB LINK</span>}
                        {isShift && <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ENUM</span>}
                        {colInfo && isMapped && colInfo.confidence !== 'unmapped' && (
                          <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.06em',
                            background: colInfo.confidence === 'exact' ? 'rgba(16,185,129,0.1)' : colInfo.confidence === 'fuzzy' ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.08)',
                            color:      colInfo.confidence === 'exact' ? '#34d399' : colInfo.confidence === 'fuzzy' ? '#fbbf24' : '#fb7185',
                          }}>{colInfo.confidence}</span>
                        )}
                      </div>
                    </div>

                    {/* Col 2: CSV Column selector */}
                    <div>
                      {isNum && !col ? (
                        // Number fallback input
                        <input type="number" min="0"
                          value={field === 'units' ? defaultUnits : defaultDefects}
                          onChange={e => field === 'units' ? setDefaultUnits(e.target.value) : setDefaultDefects(e.target.value)}
                          style={{ width: '100%', background: '#0c0c10', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '7px 10px', color: '#818cf8', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', outline: 'none', colorScheme: 'dark' }}
                        />
                      ) : isShift && col ? (
                        // Shift: show enum pills + dropdown
                        <div>
                          <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                            {Object.entries(SHIFT_COLORS).map(([v, [c, bg, border]]) => (
                              <span key={v} style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: bg, color: c, border: `1px solid ${border}` }}>{v}</span>
                            ))}
                          </div>
                          <div className="relative">
                            <select value={col || ''} onChange={e => handleMappingChange(field, e.target.value)}
                              style={{ width: '100%', background: '#0c0c10', border: `1px solid ${isMapped ? 'rgba(16,185,129,0.25)' : '#2a2a3a'}`, borderRadius: 8, padding: '6px 28px 6px 10px', color: isMapped ? '#e2e8f0' : '#54546a', fontSize: 12, cursor: 'pointer', appearance: 'none', outline: 'none' }}>
                              <option value="">— skip —</option>
                              {analysis.headers.filter(h => !Object.entries(mapping).some(([k, v]) => k !== field && v === h)).map(h => <option key={h} value={h}>{h}</option>)}
                              {col && !analysis.headers.filter(h => !Object.entries(mapping).some(([k, v]) => k !== field && v === h)).includes(col) && <option value={col}>{col}</option>}
                            </select>
                            <FaChevronDown size={8} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: '#54546a', pointerEvents: 'none' }} />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <select value={col || ''} onChange={e => handleMappingChange(field, e.target.value)}
                            style={{ width: '100%', background: '#0c0c10', border: `1px solid ${isMapped ? 'rgba(16,185,129,0.25)' : '#2a2a3a'}`, borderRadius: 8, padding: '7px 28px 7px 10px', color: isMapped ? '#e2e8f0' : '#54546a', fontSize: 12, cursor: 'pointer', appearance: 'none', outline: 'none' }}>
                            <option value="">— skip / use default —</option>
                            {analysis.headers.filter(h => !Object.entries(mapping).some(([k, v]) => k !== field && v === h)).map(h => <option key={h} value={h}>{h}</option>)}
                            {col && !analysis.headers.filter(h => !Object.entries(mapping).some(([k, v]) => k !== field && v === h)).includes(col) && <option value={col}>{col}</option>}
                          </select>
                          <FaChevronDown size={8} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: '#54546a', pointerEvents: 'none' }} />
                        </div>
                      )}
                      {/* Number default input when unmapped */}
                      {isNum && !col && false /* already handled above */ && null}
                    </div>

                    {/* Col 3: Sample values */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {col ? (
                        samples.length ? samples.map((s, i) => {
                          const vm  = valueMappings[field]?.[s];
                          const sug = analysis.valueSuggestions?.[field]?.[s];
                          let dotC = '#54546a';
                          if (isLinked && vm) {
                            dotC = vm.action === 'skip' ? '#fb7185'
                              : vm.action === 'new'  ? '#818cf8'
                              : sug?.matchType === 'exact' ? '#34d399' : '#fbbf24';
                          }
                          return (
                            <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${dotC}15`, color: dotC, border: `1px solid ${dotC}30`, fontFamily: 'monospace', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s}>
                              {s}
                            </span>
                          );
                        }) : <span style={{ fontSize: 11, color: '#3a3a5a', fontStyle: 'italic' }}>—</span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#2a2a3a', fontStyle: 'italic' }}>not mapped</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Value Reconciliation Panels ── */}
            {reconFields.length > 0 && (
              <div className="space-y-4">
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#54546a', paddingLeft: 2 }}>
                  Value Reconciliation
                </div>

                {reconFields.map(field => {
                  const vals        = valueMappings[field] || {};
                  const suggestions = analysis.valueSuggestions?.[field] || {};
                  const dbItems     = getDbItems(analysis, field);
                  const csvValues   = Object.keys(vals);

                  const exactCt = csvValues.filter(v => vals[v].action === 'map' && suggestions[v]?.matchType === 'exact').length;
                  const fuzzyCt = csvValues.filter(v => vals[v].action === 'map' && suggestions[v]?.matchType !== 'exact' && suggestions[v]).length;
                  const newCt   = csvValues.filter(v => vals[v].action === 'new').length;
                  const skipCt  = csvValues.filter(v => vals[v].action === 'skip').length;

                  return (
                    <div key={field} className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
                      {/* Panel header */}
                      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1f1f28', background: 'rgba(99,102,241,0.02)' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', textTransform: 'capitalize' }}>
                          {FIELD_LABELS[field] || field} Values
                        </span>
                        <span style={{ fontSize: 10, color: '#3a3a5a' }}>({csvValues.length} unique in CSV)</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {exactCt > 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>✓ {exactCt} exact</span>}
                          {fuzzyCt > 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>~ {fuzzyCt} fuzzy</span>}
                          {newCt  > 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>+ {newCt} new</span>}
                          {skipCt > 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.15)' }}>✗ {skipCt} skip</span>}
                        </div>
                      </div>

                      {/* Value rows */}
                      {csvValues.map((csvVal, idx) => {
                        const vm         = vals[csvVal];
                        const sug        = suggestions[csvVal];
                        const isExact    = vm.action === 'map' && sug?.matchType === 'exact';
                        const isFuzzy    = vm.action === 'map' && sug?.matchType !== 'exact' && !!sug;
                        const isNew      = vm.action === 'new';
                        const isSkip     = vm.action === 'skip';
                        const searchTerm = searchTerms[field]?.[csvVal] || '';
                        const dotColor   = isExact ? '#34d399' : isFuzzy ? '#fbbf24' : isNew ? '#818cf8' : '#fb7185';
                        const mappedItem = vm.action === 'map' ? dbItems.find(i => String(i.id) === String(vm.mappedId)) : null;

                        const filteredItems = dbItems.filter(item => {
                          const name = getItemName(item, field);
                          return !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase());
                        }).slice(0, 8);

                        return (
                          <div key={csvVal} style={{
                            padding: '11px 20px',
                            borderBottom: idx < csvValues.length - 1 ? '1px solid #1a1a24' : 'none',
                            background: isExact ? 'rgba(16,185,129,0.015)' : isFuzzy ? 'rgba(245,158,11,0.012)' : 'transparent',
                          }}>
                            {/* Main row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 28 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                              <code style={{ fontSize: 12, fontWeight: 600, color: '#c4c4d4', minWidth: 110, flexShrink: 0 }}>{csvVal}</code>

                              {isExact && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                  <FaArrowRight size={9} style={{ color: '#34d399' }} />
                                  <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>{getItemName(mappedItem, field) || sug?.name}</span>
                                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Exact</span>
                                  <button onClick={() => setVM(field, csvVal, { action: 'skip' })}
                                    style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 9px', borderRadius: 5, background: 'rgba(244,63,94,0.07)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.15)', cursor: 'pointer' }}>
                                    Skip
                                  </button>
                                </div>
                              )}

                              {isFuzzy && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                  <FaArrowRight size={9} style={{ color: '#fbbf24' }} />
                                  <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>{getItemName(mappedItem, field) || sug?.name}</span>
                                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fuzzy ~{sug?.score}%</span>
                                  <button onClick={() => setVM(field, csvVal, { action: 'skip' })}
                                    style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 9px', borderRadius: 5, background: 'rgba(244,63,94,0.07)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.15)', cursor: 'pointer' }}>
                                    Skip
                                  </button>
                                </div>
                              )}

                              {isNew && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                  <FaPlus size={9} style={{ color: '#818cf8' }} />
                                  <input value={vm.newName || csvVal}
                                    onChange={e => setVM(field, csvVal, { newName: e.target.value })}
                                    style={{ fontSize: 11, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '3px 8px', color: '#818cf8', outline: 'none', width: 140 }}
                                  />
                                  <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Create New</span>
                                  <button onClick={() => setVM(field, csvVal, { action: 'skip' })}
                                    style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 9px', borderRadius: 5, background: 'rgba(244,63,94,0.07)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.15)', cursor: 'pointer' }}>
                                    Skip
                                  </button>
                                </div>
                              )}

                              {isSkip && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                  <FaBan size={9} style={{ color: '#fb7185' }} />
                                  <span style={{ fontSize: 11, color: '#3a3a5a', fontStyle: 'italic' }}>Rows with this value will be skipped</span>
                                  <button onClick={() => setVM(field, csvVal, sug ? { action: 'map', mappedId: sug.id } : { action: 'new', newName: csvVal })}
                                    style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 9px', borderRadius: 5, background: 'rgba(16,185,129,0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.15)', cursor: 'pointer' }}>
                                    Restore
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Search box for fuzzy / new rows */}
                            {(isFuzzy || isNew) && !isSkip && (
                              <div style={{ marginTop: 8, marginLeft: 18 }}>
                                <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: 340 }}>
                                  <FaSearch size={9} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#54546a', pointerEvents: 'none' }} />
                                  <input placeholder={`Search ${field}s in database…`} value={searchTerm}
                                    onChange={e => setST(field, csvVal, e.target.value)}
                                    style={{ width: '100%', background: '#0c0c10', border: '1px solid #2a2a3a', borderRadius: 7, padding: '5px 10px 5px 27px', color: '#c4c4d4', fontSize: 11, outline: 'none', colorScheme: 'dark' }}
                                  />
                                </div>
                                {searchTerm && (
                                  <div style={{ marginTop: 4, background: '#0c0c10', border: '1px solid #1f1f28', borderRadius: 7, overflow: 'hidden', maxWidth: 340 }}>
                                    {filteredItems.length ? filteredItems.map(item => {
                                      const name = getItemName(item, field);
                                      return (
                                        <button key={item.id}
                                          onClick={() => { setVM(field, csvVal, { action: 'map', mappedId: item.id }); setST(field, csvVal, ''); }}
                                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', fontSize: 11, color: '#c4c4d4', background: 'transparent', border: 'none', borderBottom: '1px solid #1a1a24', cursor: 'pointer' }}
                                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                          {name}
                                        </button>
                                      );
                                    }) : (
                                      <div style={{ padding: '8px 12px', fontSize: 11, color: '#3a3a5a', fontStyle: 'italic' }}>No matches in database</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Production: Calendar + Product fallback ── */}
            {isProd && (
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Default date */}
                <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #1f1f28', background: 'rgba(6,182,212,0.04)' }}>
                    <FaCalendarAlt size={11} style={{ color: '#22d3ee' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#22d3ee' }}>Production Date</span>
                    <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>FALLBACK</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <p style={{ fontSize: 11, color: '#54546a', marginBottom: 12, lineHeight: 1.6 }}>Applied to every row that has no date in the CSV.</p>
                    <div style={{ position: 'relative' }}>
                      <input type="date" value={defaultDate} onChange={e => setDefaultDate(e.target.value)}
                        max={new Date().toISOString().slice(0, 10)}
                        style={{ width: '100%', background: '#0c0c10', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 10, padding: '10px 14px 10px 40px', color: '#e2e8f0', fontSize: 13, fontWeight: 600, outline: 'none', colorScheme: 'dark', cursor: 'pointer' }} />
                      <FaCalendarAlt size={13} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#22d3ee', pointerEvents: 'none' }} />
                    </div>
                    {defaultDate && (
                      <div style={{ marginTop: 10, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.14)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#67e8f9', fontWeight: 600 }}>
                          {new Date(defaultDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Default product chips */}
                {analysis.dbData?.products?.length > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #1f1f28', background: 'rgba(16,185,129,0.04)' }}>
                      <FaBoxOpen size={11} style={{ color: '#34d399' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#34d399' }}>Default Product</span>
                      <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>FALLBACK</span>
                    </div>
                    <div style={{ padding: 16 }}>
                      <p style={{ fontSize: 11, color: '#54546a', marginBottom: 12, lineHeight: 1.6 }}>Used when a CSV product name can't be matched to DB.</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {analysis.dbData.products.map(p => {
                          const sel = String(defaultProductId) === String(p.id);
                          return (
                            <button key={p.id} onClick={() => setDefaultProductId(String(p.id))}
                              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                background: sel ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.25)',
                                border: `1px solid ${sel ? 'rgba(16,185,129,0.4)' : '#2a2a3a'}`,
                                color: sel ? '#34d399' : '#9090a4' }}>
                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: sel ? '#34d399' : '#3a3a5a', flexShrink: 0 }} />
                              {p.name}
                              {sel && <FaCheckCircle size={9} style={{ color: '#34d399' }} />}
                            </button>
                          );
                        })}
                      </div>
                      {defaultProductId && (
                        <div style={{ marginTop: 10, borderRadius: 7, padding: '6px 10px', fontSize: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)', color: '#34d399' }}>
                          ✓ Fallback: <strong>{analysis.dbData.products.find(p => String(p.id) === String(defaultProductId))?.name}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Employee defaults ── */}
            {!isProd && analysis.dbData && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
                <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #1f1f28' }}>
                  <FaUsers size={11} style={{ color: '#818cf8' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#818cf8' }}>Default Values (when column is missing)</span>
                </div>
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    ['dept', 'Default Department', defaultDeptId, setDefaultDeptId, analysis.dbData.departments, d => d.name],
                    ['role', 'Default Role', defaultRoleId, setDefaultRoleId, analysis.dbData.roles, r => `${r.title} (L${r.level})`],
                  ].map(([key, label, val, setter, items, fmt]) => (
                    <div key={key}>
                      <p style={{ fontSize: 11, color: '#54546a', marginBottom: 8 }}>{label}</p>
                      <div style={{ position: 'relative' }}>
                        <select value={val} onChange={e => setter(e.target.value)}
                          style={{ width: '100%', background: '#0c0c10', border: '1px solid #2a2a3a', borderRadius: 8, padding: '8px 28px 8px 12px', color: '#e2e8f0', fontSize: 12, cursor: 'pointer', appearance: 'none', outline: 'none' }}>
                          {items?.map(item => <option key={item.id} value={item.id}>{fmt(item)}</option>)}
                        </select>
                        <FaChevronDown size={9} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#54546a', pointerEvents: 'none' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Data Preview ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
              <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1f1f28' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#818cf8' }}>Data Preview</span>
                <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 99, background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>First 5 rows</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#0c0c10', borderBottom: '1px solid #1f1f28' }}>
                      {isProd && (
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#22d3ee', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FaCalendarAlt size={8} /> Date</div>
                        </th>
                      )}
                      {visibleFields.filter(f => mapping[f]).map(f => (
                        <th key={f} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#54546a', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {f === 'product' && <FaBoxOpen size={8} style={{ color: '#34d399' }} />}
                            {(f === 'employee' || f === 'employeeCode') && <FaUsers size={8} style={{ color: '#818cf8' }} />}
                            {FIELD_LABELS[f] || f}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.preview.map((row, i) => {
                      const fmtDate = defaultDate
                        ? new Date(defaultDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—';
                      return (
                        <tr key={i} style={{ borderBottom: i < analysis.preview.length - 1 ? '1px solid #1a1a24' : 'none', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                          {isProd && (
                            <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#67e8f9', fontFamily: 'monospace', fontSize: 11 }}>
                                <FaCalendarAlt size={9} style={{ color: '#22d3ee' }} />{fmtDate}
                              </span>
                            </td>
                          )}
                          {visibleFields.filter(f => mapping[f]).map(f => {
                            const val = row.mapped?.[f] ?? row.original?.[mapping[f]];
                            const isNum = ['units', 'defects', 'experience'].includes(f);
                            const shiftUpper = val?.toUpperCase?.();
                            const shiftColors = shiftUpper && SHIFT_COLORS[shiftUpper];
                            return (
                              <td key={f} style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                                {!val ? (
                                  <span style={{ fontSize: 11, color: '#3a3a5a', fontStyle: 'italic' }}>—</span>
                                ) : f === 'product' ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: 'rgba(16,185,129,0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.18)' }}>
                                    <FaBoxOpen size={8} />{val}
                                  </span>
                                ) : isNum ? (
                                  <span style={{ color: '#818cf8', fontFamily: 'monospace', fontWeight: 600 }}>{Number(val).toLocaleString()}</span>
                                ) : f === 'shift' && shiftColors ? (
                                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: shiftColors[1], color: shiftColors[0], border: `1px solid ${shiftColors[2]}` }}>{shiftUpper}</span>
                                ) : (
                                  <span style={{ color: '#9090a4' }}>{val}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Summary screen or action bar ── */}
            {showSummary ? (
              <div className="rounded-xl p-5 space-y-4" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Pre-Import Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    ['Total Rows', summaryStats.total, '#818cf8'],
                    ['Values Ready', summaryStats.mapped, '#34d399'],
                    ['Will Skip', summaryStats.willSkip, '#fb7185'],
                    ['New Records', summaryStats.newRecs, '#fbbf24'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'monospace' }}>{val}</div>
                      <div style={{ fontSize: 10, color: '#54546a', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {summaryStats.newRecs > 0 && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', fontSize: 12, color: '#fbbf24' }}>
                    ⚠ {summaryStats.newRecs} new record(s) will be created in the database before import.
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setShowSummary(false)} className="btn-industrial btn-secondary px-5 py-2.5">← Back</button>
                  <button onClick={runImport} disabled={loading}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                      background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff' }}>
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing…</>
                      : <><FaPlay size={11} /> Confirm & Import {analysis.totalRows.toLocaleString()} Rows</>}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(1)} className="btn-industrial btn-secondary px-5 py-2.5">← Back</button>
                <button onClick={() => setShowSummary(true)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff' }}>
                  <FaArrowRight size={11} /> Review & Import {analysis.totalRows.toLocaleString()} Rows
                </button>
              </div>
            )}

          </div>
        );
      })()}

      {/* ─── STEP 3: Done ───────────────────────────────────────────────── */}
      {step === 3 && result && (
        <div className="industrial-card-elevated p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <FaCheckCircle size={32} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Import Complete!</h2>
            <p className="text-sm text-[var(--text-secondary)]">{result.message}</p>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <div className="kpi-card px-6">
              <div className="kpi-label">Imported</div>
              <div className="kpi-value text-[var(--color-success)]">{result.imported}</div>
            </div>
            <div className="kpi-card px-6">
              <div className="kpi-label">Skipped</div>
              <div className="kpi-value text-[var(--color-warning)]">{result.skipped}</div>
            </div>
            {result.newProducts > 0 && (
              <div className="kpi-card px-6">
                <div className="kpi-label">New Products</div>
                <div className="kpi-value" style={{ color: '#fbbf24' }}>{result.newProducts}</div>
              </div>
            )}
            {result.newEmployees > 0 && (
              <div className="kpi-card px-6">
                <div className="kpi-label">New Employees</div>
                <div className="kpi-value" style={{ color: '#818cf8' }}>{result.newEmployees}</div>
              </div>
            )}
          </div>
          {result.errors?.length > 0 && (
            <div className="text-left rounded-lg p-3" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <div className="text-xs font-semibold mb-2" style={{ color: '#fb7185' }}>Errors ({result.errors.length})</div>
              {result.errors.slice(0, 10).map((e, i) => <div key={i} className="text-xs text-[var(--text-secondary)]">{e}</div>)}
              {result.errors.length > 10 && <div className="text-xs" style={{ color: '#54546a', marginTop: 4 }}>…and {result.errors.length - 10} more</div>}
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
