'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBrain, FaPaperPlane, FaTrash,
  FaPlay, FaTimes, FaCheckCircle, FaChevronDown, FaChevronUp,
  FaBolt, FaLightbulb, FaSpinner,
} from 'react-icons/fa';
import API from '@/lib/api';
import { emit, DataEvents } from '@/lib/events';
import { invalidateCache } from '@/lib/hooks/useFactoryData';

const STORAGE_KEY = 'factoryflow_chat_v2';

const QUERY_CHIPS = [
  { label: '📊 Units today',       q: 'How many units were produced today?' },
  { label: '🏆 Top producer',      q: 'Who is the highest producing employee?' },
  { label: '⚠ Worst defects',      q: 'Which product has the highest defect rate?' },
  { label: '📉 Low efficiency',    q: 'Which department has the lowest efficiency?' },
  { label: '📈 Production trend',  q: 'Analyze our production trend and give a forecast.' },
  { label: '🧠 Full analysis',     q: 'Give me a complete system analysis with strengths and risks.' },
];

const ACTION_CHIPS = [
  { label: '➕ Add employee',    q: 'Add a new employee named John Doe with code EMP099.' },
  { label: '📦 Log production',  q: 'Add a production record with 500 units and 5 defects for the first product, morning shift.' },
  { label: '🔄 Status change',   q: 'Set employee EMP001 status to on_leave.' },
  { label: '📧 Update email',    q: 'Update email for employee EMP001 to john@example.com.' },
  { label: '⬆ Promote',         q: 'Promote employee EMP001 to the next role.' },
  { label: '🗑 Delete record',   q: 'Delete production record with ID 1.' },
];

/* ── Auto-generate narrative when AI skips it ────────────────────────── */
function narrativeFromAction(action) {
  const d = action.data || {};
  switch (action.type) {
    case 'create_employee':    return `Adding new employee **${d.name || 'Unknown'}** with code \`${d.employeeCode || 'auto'}\` to the system.`;
    case 'update_employee':    return `Updating employee record${d.email ? ` — setting email to \`${d.email}\`` : ''}${d.status ? ` — changing status to **${d.status}**` : ''}${d.name ? ` — renaming to **${d.name}**` : ''}.`;
    case 'delete_employee':    return `Preparing to permanently delete employee \`${d.employeeId || d.employeeCode || 'unknown'}\` from the system.`;
    case 'create_production':  return `Logging a new production record — **${d.units || 100}** units of product \`${d.productId}\` on ${d.shift || 'MORNING'} shift.`;
    case 'update_production':  return `Updating production record **#${d.recordId}** with new values.`;
    case 'delete_production':  return `Deleting production record **#${d.recordId || d.id}** from the database.`;
    case 'promote_employee':   return `Promoting employee \`${d.employeeId}\` to a higher role in the hierarchy.`;
    case 'update_employee_status': return `Changing employee \`${d.employeeId}\` status to **${d.status}**.`;
    default:                   return `Executing: **${action.type.replace(/_/g, ' ')}** — review the action below.`;
  }
}

/* ── Parse action block ──────────────────────────────────────────────── */
function parseActionBlock(text) {
  const match = text.match(/```action\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); } catch { return null; }
}
function stripActionBlock(text) {
  return text.replace(/```action[\s\S]*?```/g, '').trim();
}

/* ── Markdown renderer ───────────────────────────────────────────────── */
function Markdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ fontSize: 13, color: '#c8c8dc', lineHeight: 1.8 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        if (/^#{1,3}\s/.test(line)) {
          return (
            <div key={i} style={{ fontWeight: 700, color: '#f1f1f7', fontSize: 13.5, marginTop: 10, marginBottom: 3 }}>
              {line.replace(/^#{1,3}\s/, '')}
            </div>
          );
        }
        if (/^(\s*[-•▸]|\d+\.)/.test(line)) {
          const content = line.replace(/^(\s*[-•▸]|\d+\.\s*)/, '').trim();
          return (
            <div key={i} style={{ display: 'flex', gap: 8, paddingLeft: 4, marginBottom: 2 }}>
              <span style={{ color: '#6366f1', flexShrink: 0, marginTop: 1 }}>▸</span>
              <span>{renderInline(content)}</span>
            </div>
          );
        }
        return <div key={i} style={{ marginBottom: 2 }}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p))
      return <strong key={i} style={{ color: '#f1f1f7', fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(p))
      return <code key={i} style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', borderRadius: 4, padding: '1px 5px', fontSize: 12 }}>{p.slice(1, -1)}</code>;
    return p;
  });
}

/* ── Action card ─────────────────────────────────────────────────────── */
function ActionCard({ action, onDismiss }) {
  const [state, setState] = useState('idle'); // idle | running | done | error
  const [msg,   setMsg]   = useState('');

  const execute = async () => {
    setState('running');
    try {
      const res = await API.post('/ai/action', { type: action.type, data: action.data });
      setMsg(res.data.message || 'Done');
      setState('done');
      const t = action.type;
      if (t.includes('production')) invalidateCache(['/production', '/analytics/executive-summary']);
      if (t.includes('employee') || t.includes('promote') || t === 'update_employee_status')
        invalidateCache(['/employees', '/analytics/executive-summary']);
      if (t.includes('production'))  emit(DataEvents.PRODUCTION_CHANGED);
      if (t.includes('employee') || t.includes('promote') || t === 'update_employee_status')
        emit(DataEvents.EMPLOYEES_CHANGED);
      if (t.includes('promote'))     emit(DataEvents.PROMOTIONS_CHANGED);
      if (t.includes('role'))        emit(DataEvents.ROLES_CHANGED);
      emit(DataEvents.ANY);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Action failed — please try again.');
      setState('error');
    }
  };

  const actionLabel = action.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{
      marginTop: 10, borderRadius: 14,
      background: 'linear-gradient(135deg, rgba(245,158,11,0.04), rgba(251,191,36,0.02))',
      border: '1px solid rgba(245,158,11,0.22)',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(245,158,11,0.06)',
    }}>
      {/* Header */}
      <div style={{
        padding: '9px 14px',
        background: 'rgba(245,158,11,0.07)',
        borderBottom: '1px solid rgba(245,158,11,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: 'rgba(245,158,11,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FaBolt size={9} style={{ color: '#f59e0b' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em' }}>
            PENDING ACTION
          </span>
        </div>
        <span style={{
          fontSize: 9.5, color: 'rgba(245,158,11,0.6)',
          background: 'rgba(245,158,11,0.08)',
          padding: '2px 8px', borderRadius: 20,
          border: '1px solid rgba(245,158,11,0.15)',
          fontFamily: 'monospace',
        }}>
          {action.type}
        </span>
      </div>

      <div style={{ padding: '13px 14px 14px' }}>
        {/* Confirm text */}
        <div style={{
          display: 'flex', gap: 9, alignItems: 'flex-start',
          padding: '10px 12px', borderRadius: 9, marginBottom: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: 15, lineHeight: 1, marginTop: 1 }}>⚡</span>
          <p style={{ fontSize: 12.5, color: '#e2e2f2', lineHeight: 1.65, margin: 0 }}>
            {action.confirm}
          </p>
        </div>

        {state === 'idle' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={execute} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.18))',
              color: '#34d399', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
              boxShadow: '0 2px 8px rgba(16,185,129,0.1)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(16,185,129,0.32),rgba(5,150,105,0.26))'; e.currentTarget.style.boxShadow = '0 3px 14px rgba(16,185,129,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(16,185,129,0.22),rgba(5,150,105,0.18))'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.1)'; }}
            >
              <FaPlay size={8} /> Confirm &amp; Execute
            </button>
            <button onClick={onDismiss} style={{
              flex: '0 0 42px', padding: '10px 0', borderRadius: 10,
              border: '1px solid rgba(244,63,94,0.18)',
              background: 'rgba(244,63,94,0.05)', color: '#fb7185',
              fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
              title="Dismiss"
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.05)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.18)'; }}
            >
              <FaTimes size={10} />
            </button>
          </div>
        )}

        {state === 'running' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(99,102,241,0.07)',
            border: '1px solid rgba(99,102,241,0.15)',
            color: '#818cf8', fontSize: 12.5,
          }}>
            <FaSpinner size={12} style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
            <span>Executing <strong style={{ color: '#a5b4fc' }}>{actionLabel}</strong>…</span>
          </div>
        )}

        {(state === 'done' || state === 'error') && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            borderRadius: 10, padding: '11px 13px',
            background: state === 'done' ? 'rgba(16,185,129,0.07)' : 'rgba(244,63,94,0.07)',
            border: `1px solid ${state === 'done' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
          }}>
            <FaCheckCircle size={13} style={{ color: state === 'done' ? '#10b981' : '#f43f5e', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: state === 'done' ? '#10b981' : '#f43f5e', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {state === 'done' ? 'Completed' : 'Failed'}
              </div>
              <span style={{ fontSize: 12.5, color: state === 'done' ? '#6ee7b7' : '#f87191', lineHeight: 1.55 }}>{msg}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main chat ───────────────────────────────────────────────────────── */
export default function AskAIChat({ defaultOpen = false }) {
  const [open,     setOpen]     = useState(defaultOpen);
  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [actions,  setActions]  = useState({});
  const [tab,      setTab]      = useState('queries');
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);

  // Persist chat to localStorage (exclude streaming placeholder)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(
        messages.filter(m => !m._streaming).slice(-50)
      ));
    } catch {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const send = useCallback(async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setMessages(prev => [
      ...prev,
      { role: 'user', content: msg },
      { role: 'assistant', content: '', _streaming: true },
    ]);
    setInput('');
    setLoading(true);

    const history = [...messages, { role: 'user', content: msg }]
      .filter(m => !m._streaming)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?._streaming) next[next.length - 1] = { ...last, content: acc };
          return next;
        });
      }

      const action       = parseActionBlock(acc);
      let   cleanContent = action ? stripActionBlock(acc) : acc;
      // If AI returned only an action block with no narrative, generate one
      if (action && !cleanContent.trim()) {
        cleanContent = narrativeFromAction(action);
      }

      setMessages(prev => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (next[lastIdx]?._streaming)
          next[lastIdx] = { role: 'assistant', content: cleanContent };
        if (action) setActions(a => ({ ...a, [lastIdx]: action }));
        return next;
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?._streaming)
          next[next.length - 1] = {
            role: 'assistant',
            content: `⚠ ${err.message || 'AI unavailable — please try again.'}`,
            _error: true,
          };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setActions({});
    setLoading(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const msgCount = messages.filter(m => !m._streaming).length;

  return (
    <div style={{
      background: '#13131a',
      border: '1px solid rgba(99,102,241,0.18)',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'inherit',
    }}>
      {/* ── Header ───────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px',
          borderBottom: open ? '1px solid rgba(255,255,255,0.06)' : 'none',
          background: 'none', cursor: 'pointer', textAlign: 'left', flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {/* Brain icon with pulse */}
          <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: loading
                ? 'rgba(168,85,247,0.3)'
                : 'rgba(99,102,241,0.12)',
              animation: loading ? 'aiBeatPulse 1s ease-in-out infinite' : 'none',
            }} />
            <div style={{
              position: 'absolute', inset: 4, borderRadius: 8,
              background: 'rgba(99,102,241,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FaBrain size={13} style={{ color: loading ? '#a855f7' : '#6366f1' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f0f0f8', letterSpacing: '-0.01em' }}>
              FactoryFlow AI
            </div>
            <div style={{ fontSize: 11, color: '#4a4a6a', marginTop: 1 }}>
              {loading
                ? <span style={{ color: '#a855f7' }}>Thinking…</span>
                : 'Full system control · CRUD · Analytics'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {msgCount > 0 && (
            <span style={{
              fontSize: 10, color: '#4a4a6a', background: 'rgba(255,255,255,0.04)',
              padding: '2px 7px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)',
            }}>{msgCount}</span>
          )}
          {open
            ? <FaChevronUp size={10} style={{ color: '#4a4a6a' }} />
            : <FaChevronDown size={10} style={{ color: '#4a4a6a' }} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {/* ── Tabs ─────────────────────────────────── */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              {[['queries', FaLightbulb, 'Queries'], ['actions', FaBolt, 'Actions']].map(([key, Icon, label]) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 0', fontSize: 11.5, fontWeight: 600,
                  color: tab === key ? '#818cf8' : '#3a3a5e',
                  borderBottom: tab === key ? '2px solid #6366f1' : '2px solid transparent',
                  background: 'none', cursor: 'pointer', transition: 'color 0.15s',
                }}>
                  <Icon size={9} /> {label}
                </button>
              ))}
            </div>

            {/* ── Chips ────────────────────────────────── */}
            <div style={{ padding: '9px 12px 7px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
                {(tab === 'queries' ? QUERY_CHIPS : ACTION_CHIPS).map(s => (
                  <button key={s.label} onClick={() => send(s.q)} disabled={loading} style={{
                    flexShrink: 0, padding: '5px 11px', borderRadius: 20, whiteSpace: 'nowrap',
                    background: tab === 'actions' ? 'rgba(245,158,11,0.07)' : 'rgba(99,102,241,0.08)',
                    border: tab === 'actions' ? '1px solid rgba(245,158,11,0.18)' : '1px solid rgba(99,102,241,0.16)',
                    color: tab === 'actions' ? '#d4a017' : '#7c83ec',
                    fontSize: 11, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.45 : 1, transition: 'opacity 0.15s',
                  }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Messages ─────────────────────────────── */}
            <div style={{
              overflowY: 'auto', padding: '14px 12px', display: 'flex',
              flexDirection: 'column', gap: 12,
              maxHeight: 360, minHeight: 100,
            }}>
              {messages.length === 0 && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 10, opacity: 0.3 }}>
                  <FaBrain size={26} style={{ color: '#6366f1' }} />
                  <p style={{ fontSize: 12, color: '#4a4a6a', textAlign: 'center' }}>
                    Ask anything · CRUD · Analytics · Insights
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === 'user' ? (
                    /* User bubble */
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{
                        maxWidth: '82%', padding: '9px 13px',
                        borderRadius: '14px 14px 3px 14px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))',
                        border: '1px solid rgba(99,102,241,0.22)',
                        fontSize: 13, color: '#e0e0f0', lineHeight: 1.6,
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    /* AI bubble */
                    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      {/* Avatar */}
                      <div style={{
                        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                        background: msg._error ? 'rgba(244,63,94,0.15)' : 'rgba(99,102,241,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginTop: 2,
                      }}>
                        <FaBrain size={11} style={{ color: msg._error ? '#f43f5e' : '#6366f1' }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          padding: '10px 13px',
                          borderRadius: '3px 14px 14px 14px',
                          background: msg._error
                            ? 'rgba(244,63,94,0.07)'
                            : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${msg._error ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.07)'}`,
                        }}>
                          {msg._streaming && !msg.content ? (
                            /* Typing dots */
                            <div style={{ display: 'flex', gap: 4, padding: '2px 0' }}>
                              {[0,1,2].map(j => (
                                <div key={j} style={{
                                  width: 6, height: 6, borderRadius: '50%', background: '#6366f1',
                                  animation: `bounceDot 1.1s ease-in-out ${j * 0.17}s infinite`,
                                }} />
                              ))}
                            </div>
                          ) : (
                            <>
                              <Markdown text={msg.content} />
                              {msg._streaming && (
                                <span style={{
                                  display: 'inline-block', width: 7, height: 15,
                                  background: '#6366f1', borderRadius: 2, marginLeft: 2,
                                  verticalAlign: 'middle',
                                  animation: 'caretBlink 0.65s step-start infinite',
                                }} />
                              )}
                            </>
                          )}
                        </div>

                        {/* Action card below AI message */}
                        {!msg._streaming && actions[i] && (
                          <ActionCard
                            action={actions[i]}
                            onDismiss={() => setActions(a => { const n = { ...a }; delete n[i]; return n; })}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div ref={bottomRef} />
            </div>

            {/* ── Input ────────────────────────────────── */}
            <div style={{
              padding: '10px 12px 12px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
              background: 'rgba(0,0,0,0.15)',
            }}>
              <textarea
                ref={inputRef} rows={1} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything or give a command…"
                style={{
                  flex: 1, resize: 'none',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 11, padding: '9px 12px',
                  fontSize: 13, color: '#e8e8f4', outline: 'none',
                  lineHeight: 1.55, maxHeight: 90, overflowY: 'auto',
                  fontFamily: 'inherit', transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                title="Send"
                style={{
                  width: 38, height: 38, borderRadius: 11, border: 'none', flexShrink: 0,
                  background: (!input.trim() || loading)
                    ? 'rgba(99,102,241,0.12)'
                    : 'linear-gradient(135deg,#6366f1,#818cf8)',
                  color: (!input.trim() || loading) ? '#4a4a6a' : '#fff',
                  cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', boxShadow: (!input.trim() || loading) ? 'none' : '0 2px 10px rgba(99,102,241,0.4)',
                }}
              >
                <FaPaperPlane size={12} />
              </button>
              <button
                onClick={clearChat}
                title="Clear chat"
                style={{
                  width: 38, height: 38, borderRadius: 11,
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'transparent', color: '#3a3a5e',
                  cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fb7185'}
                onMouseLeave={e => e.currentTarget.style.color = '#3a3a5e'}
              >
                <FaTrash size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes caretBlink   { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bounceDot    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes spin         { to{transform:rotate(360deg)} }
        @keyframes aiBeatPulse  { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.35);opacity:0} }
      `}</style>
    </div>
  );
}
