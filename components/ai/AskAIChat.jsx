'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBrain, FaPaperPlane, FaTrash, FaCircle,
  FaPlay, FaTimes, FaCheckCircle, FaChevronDown, FaChevronUp,
  FaBolt, FaLightbulb,
} from 'react-icons/fa';
import API from '@/lib/api';
import { emit, DataEvents } from '@/lib/events';
import { invalidateCache } from '@/lib/hooks/useFactoryData';

const STORAGE_KEY = 'factoryflow_chat_history';

/* ── Quick action / query chips ─────────────────────────────────────── */
const QUERY_CHIPS = [
  { label: '📊 Units today',        q: 'How many units were produced today?' },
  { label: '🏆 Top producer',       q: 'Who is the highest producing employee?' },
  { label: '⚠ Worst defects',       q: 'Which product has the highest defect rate?' },
  { label: '📉 Low efficiency',     q: 'Which department has the lowest efficiency?' },
  { label: '📈 Production trend',   q: 'Analyze our production trend and forecast next month.' },
  { label: '🧠 System insights',    q: 'Give me a full system analysis with strengths and risks.' },
];

const ACTION_CHIPS = [
  { label: '➕ Add employee',       q: 'Add a new employee named John Doe with code EMP099 to the default department.' },
  { label: '📦 Log production',     q: 'Add a production record with 500 units and 5 defects for the first product, morning shift.' },
  { label: '🔄 Set on leave',       q: 'Set employee status to on_leave — specify the employee code.' },
  { label: '📧 Update email',       q: 'Update email for employee — specify code and new email.' },
  { label: '🗑 Delete record',      q: 'Delete production record — specify the record ID.' },
  { label: '⬆ Promote employee',   q: 'Promote an employee — specify name and new role.' },
];

/* ── Parse action block ──────────────────────────────────────────────── */
function parseActionBlock(text) {
  const match = text.match(/```action\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); } catch { return null; }
}
function stripActionBlock(text) {
  return text.replace(/```action[\s\S]*?```/g, '').trim();
}

/* ── Markdown-lite renderer ──────────────────────────────────────────── */
function SafeMarkdown({ children }) {
  if (!children) return null;
  return (
    <div style={{ fontSize: 12.5, color: '#9090a4', lineHeight: 1.85 }}>
      {children.split('\n').map((line, i) => {
        if (/^#{1,3}\s/.test(line))
          return <p key={i} style={{ fontWeight: 700, color: '#f0f0f4', marginTop: 8, marginBottom: 2, fontSize: 13 }}>{line.replace(/^#{1,3}\s/, '')}</p>;
        if (/^(\s*[-•▸✓✗]|\d+\.)/.test(line))
          return <p key={i} style={{ paddingLeft: 12, marginBottom: 2 }}>{line}</p>;
        if (line.trim() === '') return <br key={i} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ marginBottom: 2 }}>
            {parts.map((p, j) =>
              /^\*\*[^*]+\*\*$/.test(p)
                ? <strong key={j} style={{ color: '#f0f0f4', fontWeight: 600 }}>{p.slice(2,-2)}</strong>
                : p
            )}
          </p>
        );
      })}
    </div>
  );
}

/* ── Action confirmation card ────────────────────────────────────────── */
function ActionCard({ action, onDismiss }) {
  const [running, setRunning] = useState(false);
  const [result,  setResult]  = useState(null);

  const execute = async () => {
    setRunning(true);
    try {
      const res = await API.post('/ai/action', { type: action.type, data: action.data });
      setResult({ ok: true, msg: res.data.message });

      const t = action.type;
      // Invalidate cache + emit events for instant UI update
      if (t.includes('production')) {
        invalidateCache(['/production', '/analytics/executive-summary']);
        emit(DataEvents.PRODUCTION_CHANGED);
      }
      if (t.includes('employee') || t.includes('promote') || t === 'update_employee_status') {
        invalidateCache(['/employees', '/analytics/executive-summary']);
        emit(DataEvents.EMPLOYEES_CHANGED);
      }
      if (t.includes('role'))    emit(DataEvents.ROLES_CHANGED);
      if (t.includes('promote')) emit(DataEvents.PROMOTIONS_CHANGED);
      emit(DataEvents.ANY);
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.error || 'Action failed — please try again.' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:12, marginTop:10, padding:'12px 14px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
        <div style={{ width:3, height:14, borderRadius:2, background:'#f59e0b', flexShrink:0 }} />
        <span style={{ fontSize:10, fontWeight:700, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.07em' }}>⚡ Confirm Action</span>
      </div>
      <p style={{ fontSize:12.5, color:'#c4c4d4', lineHeight:1.7, marginBottom:12 }}>{action.confirm}</p>

      {result ? (
        <div style={{
          display:'flex', alignItems:'center', gap:8, borderRadius:8, padding:'8px 12px',
          background: result.ok ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
          border: `1px solid ${result.ok ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
        }}>
          <FaCheckCircle size={10} style={{ color: result.ok ? '#10b981' : '#f43f5e', flexShrink:0 }} />
          <span style={{ fontSize:12, color: result.ok ? '#10b981' : '#f87191' }}>{result.msg}</span>
        </div>
      ) : (
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={execute} disabled={running} style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            padding:'8px 0', borderRadius:8, border:'none', cursor: running ? 'not-allowed' : 'pointer',
            background: running ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.18)',
            color:'#34d399', fontSize:12.5, fontWeight:700, opacity: running ? 0.7 : 1,
          }}>
            {running
              ? <span style={{ width:10, height:10, border:'2px solid #34d399', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 0.6s linear infinite' }} />
              : <FaPlay size={8} />}
            {running ? 'Executing…' : 'Yes, Execute'}
          </button>
          <button onClick={onDismiss} disabled={running} style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            padding:'8px 0', borderRadius:8, border:'1px solid rgba(244,63,94,0.25)',
            background:'rgba(244,63,94,0.07)', color:'#fb7185',
            fontSize:12.5, fontWeight:700, cursor: running ? 'not-allowed' : 'pointer',
            opacity: running ? 0.4 : 1,
          }}>
            <FaTimes size={8} />
            No, Cancel
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main chat component ─────────────────────────────────────────────── */
export default function AskAIChat({ defaultOpen = false, compact = false }) {
  const [open,      setOpen]      = useState(defaultOpen);
  const [messages,  setMessages]  = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [actions,   setActions]   = useState({});
  const [tab,       setTab]       = useState('queries'); // 'queries' | 'actions'
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const toSave = messages.filter(m => !m._streaming).slice(-40); // keep last 40
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch {}
  }, [messages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 120); }, [open]);

  const send = useCallback(async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg     = { role: 'user',      content: msg };
    const placeholder = { role: 'assistant', content: '', _streaming: true };

    setMessages(prev => [...prev, userMsg, placeholder]);
    setInput('');
    setLoading(true);

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: msg, history }),
        signal:  abortRef.current.signal,
      });
      if (!res.ok) throw new Error('AI unavailable');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const next = [...prev];
          if (next[next.length - 1]?._streaming)
            next[next.length - 1] = { ...next[next.length - 1], content: accumulated };
          return next;
        });
      }

      const action       = parseActionBlock(accumulated);
      const cleanContent = action ? stripActionBlock(accumulated) : accumulated;

      setMessages(prev => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (next[lastIdx]?._streaming)
          next[lastIdx] = { role: 'assistant', content: cleanContent };
        return next;
      });

      if (action) {
        setMessages(prev => {
          setActions(a => ({ ...a, [prev.length - 1]: action }));
          return prev;
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const next = [...prev];
          if (next[next.length - 1]?._streaming)
            next[next.length - 1] = { role: 'assistant', content: 'AI is temporarily unavailable. Please try again.' };
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setActions({});
    setLoading(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const maxH = compact ? 300 : 400;

  return (
    <div style={{
      background:'#17171c',
      border: `1px solid ${compact ? '#1f1f28' : 'rgba(168,85,247,0.25)'}`,
      borderRadius:14,
      overflow:'hidden',
      height: '100%',
      display:'flex',
      flexDirection:'column',
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 18px', borderBottom: open ? '1px solid #1f1f28' : 'none',
          background:'none', cursor:'pointer', textAlign:'left', flexShrink:0,
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(168,85,247,0.1)', color:'#a855f7', flexShrink:0 }}>
            <FaBrain size={14} />
          </div>
          <div>
            <p style={{ fontSize:13.5, fontWeight:600, color:'#f0f0f4', lineHeight:1.2 }}>FactoryFlow AI</p>
            <p style={{ fontSize:11, color:'#54546a', marginTop:1 }}>
              {loading ? (
                <span style={{ color:'#a855f7', display:'inline-flex', alignItems:'center', gap:4 }}>
                  <FaCircle size={5} style={{ animation:'pulse 1s ease-in-out infinite' }} /> Thinking…
                </span>
              ) : 'Full system control · Real-time · CRUD + Insights'}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {messages.length > 0 && (
            <span style={{ fontSize:10, color:'#3a3a5a', background:'rgba(255,255,255,0.04)', padding:'2px 8px', borderRadius:20, border:'1px solid #2a2a3a' }}>
              {messages.filter(m => !m._streaming).length} msgs
            </span>
          )}
          {open ? <FaChevronUp size={11} style={{ color:'#54546a' }} /> : <FaChevronDown size={11} style={{ color:'#54546a' }} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow:'hidden', display:'flex', flexDirection:'column', flex:1 }}
          >
            {/* Tab bar */}
            <div style={{ display:'flex', borderBottom:'1px solid #1f1f28', flexShrink:0 }}>
              {[['queries', FaLightbulb, 'Queries'], ['actions', FaBolt, 'Actions']].map(([key, Icon, label]) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  padding:'9px 0', fontSize:11, fontWeight:600,
                  color: tab === key ? '#a855f7' : '#54546a',
                  borderBottom: tab === key ? '2px solid #a855f7' : '2px solid transparent',
                  background:'none', cursor:'pointer', transition:'color 0.15s',
                }}>
                  <Icon size={9} />
                  {label}
                </button>
              ))}
            </div>

            {/* Chips */}
            <div style={{ padding:'10px 14px 8px', borderBottom:'1px solid #1f1f28', flexShrink:0 }}>
              <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
                {(tab === 'queries' ? QUERY_CHIPS : ACTION_CHIPS).map(s => (
                  <button key={s.label} onClick={() => send(s.q)} disabled={loading} style={{
                    flexShrink:0, padding:'5px 10px', borderRadius:20, whiteSpace:'nowrap',
                    background: tab === 'actions' ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
                    border: tab === 'actions' ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(99,102,241,0.18)',
                    color: tab === 'actions' ? '#fbbf24' : '#818cf8',
                    fontSize:11, fontWeight:500, cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                  }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10, maxHeight: maxH, minHeight:80 }}>
              {messages.length === 0 && !loading && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 0', gap:8, opacity:0.35 }}>
                  <FaBrain size={24} style={{ color:'#6366f1' }} />
                  <p style={{ fontSize:12, color:'#54546a', textAlign:'center' }}>
                    Ask anything about your factory<br />or click a chip above to start
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth:'88%', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      padding:'9px 12px',
                      background: msg.role === 'user' ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.25)',
                      border: msg.role === 'user' ? '1px solid rgba(99,102,241,0.25)' : '1px solid #1f1f28',
                    }}>
                      <SafeMarkdown>{msg.content}</SafeMarkdown>
                      {msg._streaming && (
                        <span style={{ display:'inline-block', width:6, height:14, background:'#818cf8', borderRadius:2, marginLeft:2, verticalAlign:'middle', animation:'caretBlink 0.7s step-start infinite' }} />
                      )}
                    </div>
                  </div>

                  {msg.role === 'assistant' && !msg._streaming && actions[i] && (
                    <div style={{ maxWidth:'88%' }}>
                      <ActionCard
                        action={actions[i]}
                        onDismiss={() => setActions(a => { const n={...a}; delete n[i]; return n; })}
                      />
                    </div>
                  )}
                </div>
              ))}

              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div style={{ display:'flex', justifyContent:'flex-start' }}>
                  <div style={{ borderRadius:'12px 12px 12px 2px', padding:'9px 14px', background:'rgba(0,0,0,0.25)', border:'1px solid #1f1f28' }}>
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      {[0,1,2].map(j => (
                        <div key={j} style={{ width:6, height:6, borderRadius:'50%', background:'#818cf8', animation:`bounceDot 1s ease-in-out ${j*0.15}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding:'10px 14px 12px', borderTop:'1px solid #1f1f28', display:'flex', gap:8, alignItems:'flex-end', flexShrink:0 }}>
              <textarea ref={inputRef} rows={1} value={input}
                onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder="Type a command or question…"
                style={{
                  flex:1, resize:'none', background:'#0c0c0f',
                  border:'1px solid #2c2c38', borderRadius:10,
                  padding:'9px 12px', fontSize:12.5, color:'#f0f0f4',
                  outline:'none', lineHeight:1.5, maxHeight:80, overflowY:'auto',
                  transition:'border-color 150ms',
                }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; }}
                onBlur={e  => { e.target.style.borderColor = '#2c2c38'; }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading} style={{
                padding:'9px 13px', borderRadius:9, border:'none', flexShrink:0,
                background: (!input.trim() || loading) ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.85)',
                color: (!input.trim() || loading) ? '#6366f1' : '#fff',
                cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                transition:'all 0.15s',
              }}>
                <FaPaperPlane size={11} />
              </button>
              <button onClick={clearChat} style={{
                padding:'9px 10px', borderRadius:9, border:'1px solid #2c2c38',
                background:'transparent', color:'#54546a', cursor:'pointer',
                flexShrink:0, transition:'color 0.15s',
              }} title="Clear chat history">
                <FaTrash size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes caretBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bounceDot  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
