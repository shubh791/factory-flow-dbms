'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBrain, FaPaperPlane, FaTrash, FaCircle, FaPlay, FaTimes, FaCheckCircle } from 'react-icons/fa';
import API from '@/lib/api';
import { emit, DataEvents } from '@/lib/events';

/* ── Suggestion chips ────────────────────────────────────────────────── */
const SUGGESTIONS = [
  { label: 'Units today',          q: 'How many units were produced today?' },
  { label: 'Latest record',        q: 'What is the latest production record?' },
  { label: 'Active employees',     q: 'How many active employees do we have?' },
  { label: 'Top producer',         q: 'Who is the highest producing employee?' },
  { label: 'Most defective product', q: 'Which product has the highest defect rate?' },
  { label: 'Efficiency trend',     q: 'What is our overall efficiency and how can we improve it?' },
  { label: 'Worst department',     q: 'Which department has the lowest efficiency?' },
  { label: 'How to promote',       q: 'How do I promote an employee?' },
  { label: 'Add production record', q: 'How do I add a new production record?' },
];

/* ── Parse AI action blocks from message text ────────────────────────── */
function parseActionBlock(text) {
  const match = text.match(/```action\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); } catch { return null; }
}

function stripActionBlock(text) {
  return text.replace(/```action[\s\S]*?```/g, '').trim();
}

/* ── Markdown-lite renderer ──────────────────────────────────────────── */
function SafeMarkdown({ children, large }) {
  if (!children) return null;
  const lines = children.split('\n');
  return (
    <div style={{ fontSize: large ? 13.5 : 12.5, color: '#9090a4', lineHeight: 1.85 }}>
      {lines.map((line, i) => {
        if (/^#{1,3}\s/.test(line)) {
          return <p key={i} style={{ fontWeight: 700, color: '#f0f0f4', marginTop: 8, marginBottom: 2, fontSize: large ? 14 : 13 }}>{line.replace(/^#{1,3}\s/, '')}</p>;
        }
        if (/^(\s*[-•▸✓✗]|\d+\.)/.test(line)) {
          return <p key={i} style={{ paddingLeft: 12, marginBottom: 2 }}>{line}</p>;
        }
        if (line.trim() === '') return <br key={i} />;
        // Bold inline
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ marginBottom: 2 }}>
            {parts.map((part, j) =>
              /^\*\*[^*]+\*\*$/.test(part)
                ? <strong key={j} style={{ color: '#f0f0f4', fontWeight: 600 }}>{part.slice(2,-2)}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}

/* ── Action card (AI-suggested CRUD) ────────────────────────────────── */
function ActionCard({ action, onExecute, onDismiss }) {
  const [running, setRunning] = useState(false);
  const [result,  setResult]  = useState(null);

  const execute = async () => {
    setRunning(true);
    try {
      const res = await API.post('/ai/action', { type: action.type, data: action.data });
      setResult({ ok: true, msg: res.data.message });
      // Emit real-time events
      if (action.type.includes('production')) emit(DataEvents.PRODUCTION_CHANGED);
      if (action.type.includes('employee') || action.type.includes('promote')) emit(DataEvents.EMPLOYEES_CHANGED);
      if (action.type.includes('role'))      emit(DataEvents.ROLES_CHANGED);
      if (action.type.includes('promote'))   emit(DataEvents.PROMOTIONS_CHANGED);
      onExecute?.(res.data);
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.error || 'Action failed. Please try again.' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-xl mt-3" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div style={{ width: 3, height: 14, borderRadius: 2, background: '#6366f1', flexShrink: 0 }} />
          <p style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em' }}>AI Action</p>
        </div>
        <p style={{ fontSize: 12.5, color: '#9090a4', lineHeight: 1.7, marginBottom: 10 }}>{action.confirm}</p>

        {result ? (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: result.ok ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', border: `1px solid ${result.ok ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}` }}>
            <FaCheckCircle size={10} style={{ color: result.ok ? '#10b981' : '#f43f5e', flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: result.ok ? '#10b981' : '#f87191' }}>{result.msg}</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={execute}
              disabled={running}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: running ? 'not-allowed' : 'pointer',
                background: 'rgba(99,102,241,0.18)', color: '#818cf8', fontSize: 12, fontWeight: 600,
                opacity: running ? 0.6 : 1,
              }}
            >
              {running
                ? <span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: '#818cf8', borderTopColor: 'transparent' }} />
                : <FaPlay size={8} />}
              {running ? 'Executing…' : action.label}
            </button>
            <button
              onClick={onDismiss}
              style={{ padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.15)', color: '#54546a', fontSize: 12 }}
            >
              <FaTimes size={9} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main chat component ─────────────────────────────────────────────── */
export default function AskAIChat({ defaultOpen = false, large = false }) {
  const [open,      setOpen]      = useState(defaultOpen);
  const [messages,  setMessages]  = useState([
    { role: 'assistant', content: "Hello! I'm FactoryFlow AI. I can answer questions about your production data, guide you through operations, and even create records. Try a suggestion below or ask anything!" },
  ]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [actions,   setActions]   = useState({}); // msgIndex -> action object
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 120); }, [open]);

  const send = useCallback(async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg    = { role: 'user',      content: msg };
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
          if (next[next.length - 1]?._streaming) next[next.length - 1] = { ...next[next.length - 1], content: accumulated };
          return next;
        });
      }

      // Finalize — extract action block if present
      const action = parseActionBlock(accumulated);
      const cleanContent = action ? stripActionBlock(accumulated) : accumulated;

      setMessages(prev => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (next[lastIdx]?._streaming) next[lastIdx] = { role: 'assistant', content: cleanContent };
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
          if (next[next.length - 1]?._streaming) next[next.length - 1] = { role: 'assistant', content: 'Sorry, AI is temporarily unavailable. Please try again.' };
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
    setMessages([{ role: 'assistant', content: 'Chat cleared. Ask me anything about your factory data!' }]);
    setActions({});
    setLoading(false);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: large ? '1px solid rgba(168,85,247,0.25)' : '1px solid #1f1f28' }}>

      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ borderBottom: open ? '1px solid #1f1f28' : 'none', cursor: 'pointer', background: 'none', textAlign: 'left' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.08)', color: '#a855f7' }}>
            <FaBrain size={large ? 15 : 13} />
          </div>
          <div>
            <p style={{ fontSize: large ? 15 : 13, fontWeight: 600, color: '#f0f0f4' }}>Ask FactoryFlow AI</p>
            <p style={{ fontSize: large ? 12 : 11, color: '#54546a', marginTop: 1 }}>
              {large ? 'Executive AI — real-time data · CRUD actions · intelligent suggestions' : 'Streaming industrial intelligence · Context-aware'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#a855f7' }}>
              <FaCircle size={5} style={{ animation: 'pulse 1s ease-in-out infinite' }} />
              <span>Thinking…</span>
            </div>
          )}
          <span style={{ fontSize: 12, color: '#54546a' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="chat-body"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Suggestion chips */}
            <div className="px-4 pt-3 pb-1" style={{ borderBottom: '1px solid #1f1f28' }}>
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3a3a5a', fontWeight: 600, marginBottom: 6 }}>Quick questions</p>
              <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s.label} onClick={() => send(s.q)} disabled={loading}
                    style={{
                      flexShrink: 0, padding: '5px 10px', borderRadius: 20,
                      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)',
                      color: '#818cf8', fontSize: 11, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1, whiteSpace: 'nowrap', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!loading) e.target.style.background = 'rgba(99,102,241,0.16)'; }}
                    onMouseLeave={e => { e.target.style.background = 'rgba(99,102,241,0.08)'; }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="overflow-y-auto px-4 py-3 space-y-3"
              style={{ maxHeight: large ? 480 : 320, minHeight: large ? 180 : 100 }}>
              {messages.map((msg, i) => (
                <div key={i}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[88%] rounded-xl px-3 py-2.5"
                      style={{
                        background:   msg.role === 'user' ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.2)',
                        border:       msg.role === 'user' ? '1px solid rgba(99,102,241,0.25)' : '1px solid #1f1f28',
                        borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      }}
                    >
                      <SafeMarkdown large={large}>{msg.content}</SafeMarkdown>
                      {msg._streaming && (
                        <span style={{ display:'inline-block', width:6, height:14, background:'#818cf8', borderRadius:2, marginLeft:2, verticalAlign:'middle', animation:'caretBlink 0.7s step-start infinite' }} />
                      )}
                    </div>
                  </div>

                  {/* Action card below assistant message */}
                  {msg.role === 'assistant' && !msg._streaming && actions[i] && (
                    <div className="ml-0 mr-auto max-w-[88%]">
                      <ActionCard
                        action={actions[i]}
                        onExecute={() => {}}
                        onDismiss={() => setActions(a => { const n={...a}; delete n[i]; return n; })}
                      />
                    </div>
                  )}
                </div>
              ))}

              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1f1f28' }}>
                    <div className="flex items-center gap-1.5">
                      {[0,1,2].map(j => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full bg-[#818cf8]"
                          style={{ animation: `bounceDot 1s ease-in-out ${j*0.15}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 pb-4 pt-2 flex items-end gap-2" style={{ borderTop: '1px solid #1f1f28' }}>
              <textarea ref={inputRef} rows={1} value={input}
                onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder="Ask about production, defects, workforce, or request an action…"
                style={{
                  flex: 1, resize: 'none', background: '#0c0c0f', border: '1px solid #2c2c38',
                  borderRadius: 10, padding: large ? '11px 14px' : '9px 12px',
                  fontSize: large ? 13.5 : 12.5, color: '#f0f0f4', outline: 'none',
                  lineHeight: 1.5, maxHeight: large ? 120 : 80, overflowY: 'auto', transition: 'border-color 150ms',
                }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; }}
                onBlur={e  => { e.target.style.borderColor = '#2c2c38'; }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                className="ff-btn ff-btn-primary"
                style={{ padding: '9px 14px', flexShrink: 0, opacity: (!input.trim() || loading) ? 0.4 : 1 }}>
                <FaPaperPlane size={11} />
              </button>
              <button onClick={clearChat} className="ff-btn ff-btn-secondary"
                style={{ padding: '9px 11px', flexShrink: 0 }} title="Clear chat">
                <FaTrash size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes caretBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bounceDot  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}
