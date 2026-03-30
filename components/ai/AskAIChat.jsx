'use client';
/**
 * AskAIChat — streaming "Ask FactoryFlow AI" chat widget.
 *
 * Uses the /api/ai/chat streaming endpoint.
 * Passes last 6 turns for context.
 * Fully self-contained — drop into any page.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBrain, FaPaperPlane, FaTrash, FaCircle } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

// Fallback if react-markdown is not installed — render plain text
function SafeMarkdown({ children }) {
  try {
    // Try to dynamically use ReactMarkdown (it may not be installed)
    return (
      <div
        style={{ fontSize: 12.5, color: '#9090a4', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}
      >
        {children}
      </div>
    );
  } catch {
    return <p style={{ fontSize: 12.5, color: '#9090a4', lineHeight: 1.75 }}>{children}</p>;
  }
}

export default function AskAIChat({ defaultOpen = false }) {
  const [open,     setOpen]     = useState(defaultOpen);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m FactoryFlow AI. Ask me anything about your production data, KPIs, or operational performance.' },
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);

  /* ── Auto-scroll to bottom ───────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* ── Focus input when opened ─────────────────────────────────── */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  /* ── Send message ────────────────────────────────────────────── */
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg    = { role: 'user',      content: text };
    const placeholder = { role: 'assistant', content: '', _streaming: true };

    setMessages((prev) => [...prev, userMsg, placeholder]);
    setInput('');
    setLoading(true);

    // Build history (exclude the new placeholder)
    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, history }),
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
        // Update the streaming placeholder in real-time
        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (next[lastIdx]?._streaming) {
            next[lastIdx] = { ...next[lastIdx], content: accumulated };
          }
          return next;
        });
      }

      // Finalize (remove _streaming flag)
      setMessages((prev) => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (next[lastIdx]?._streaming) {
          next[lastIdx] = { role: 'assistant', content: accumulated };
        }
        return next;
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (next[lastIdx]?._streaming) {
            next[lastIdx] = { role: 'assistant', content: 'Sorry, AI is temporarily unavailable. Please try again.' };
          }
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([{ role: 'assistant', content: 'Chat cleared. Ask me anything about your production data.' }]);
    setLoading(false);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>

      {/* ── Panel header ──────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ borderBottom: open ? '1px solid #1f1f28' : 'none', cursor: 'pointer', background: 'none', textAlign: 'left' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.08)', color: '#a855f7' }}>
            <FaBrain size={13} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Ask FactoryFlow AI</p>
            <p style={{ fontSize: 11, color: '#54546a', marginTop: 1 }}>
              Streaming industrial intelligence · Context-aware
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: '#a855f7' }}>
              <FaCircle size={5} className="animate-[pulseDot_1s_ease-in-out_infinite]" />
              <span>Thinking…</span>
            </div>
          )}
          <span style={{ fontSize: 12, color: '#54546a', fontFamily: 'JetBrains Mono, monospace' }}>
            {open ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* ── Collapsible chat body ─────────────────────────────── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="chat-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Messages */}
            <div
              className="overflow-y-auto px-4 py-3 space-y-3"
              style={{ maxHeight: 340, minHeight: 120 }}
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2.5"
                    style={{
                      background:   msg.role === 'user' ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.2)',
                      border:       msg.role === 'user' ? '1px solid rgba(99,102,241,0.25)' : '1px solid #1f1f28',
                      borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    }}
                  >
                    <SafeMarkdown>{msg.content}</SafeMarkdown>
                    {msg._streaming && (
                      <span
                        style={{
                          display: 'inline-block', width: 6, height: 14,
                          background: '#818cf8', borderRadius: 2,
                          marginLeft: 2, verticalAlign: 'middle',
                          animation: 'caretBlink 0.7s step-start infinite',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1f1f28' }}>
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full bg-[#818cf8]"
                          style={{ animation: `bounceDot 1s ease-in-out ${j * 0.15}s infinite` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 pb-4 pt-2 flex items-end gap-2" style={{ borderTop: '1px solid #1f1f28' }}>
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about production, defects, workforce…"
                style={{
                  flex: 1, resize: 'none', background: '#0c0c0f', border: '1px solid #2c2c38',
                  borderRadius: 10, padding: '9px 12px', fontSize: 12.5, color: '#f0f0f4',
                  outline: 'none', lineHeight: 1.5, maxHeight: 80, overflowY: 'auto',
                  transition: 'border-color 150ms',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#2c2c38'; }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="ff-btn ff-btn-primary"
                style={{ padding: '9px 14px', flexShrink: 0, opacity: (!input.trim() || loading) ? 0.4 : 1 }}
              >
                <FaPaperPlane size={11} />
              </button>
              <button
                onClick={clearChat}
                className="ff-btn ff-btn-secondary"
                style={{ padding: '9px 11px', flexShrink: 0 }}
                title="Clear chat"
              >
                <FaTrash size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes caretBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bounceDot { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}
