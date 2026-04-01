'use client';
/**
 * FloatingChat — persistent floating AI assistant button visible on every page.
 * Shows a pill-shaped button with a custom neural-network AI icon + text label.
 * Opens the AskAIChat panel above it.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const AskAIChat = dynamic(() => import('./AskAIChat'), { ssr: false });

/* ── Custom AI / Neural-network SVG icon ─────────────────────────── */
function AIIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer dashed orbit ring */}
      <circle cx="14" cy="14" r="12.5" stroke="currentColor" strokeWidth="1"
        strokeDasharray="3.5 2.5" strokeLinecap="round" opacity="0.45" />

      {/* Four cardinal node dots */}
      <circle cx="14" cy="2.5"  r="2"   fill="currentColor" />
      <circle cx="25.5" cy="14" r="2"   fill="currentColor" />
      <circle cx="14" cy="25.5" r="2"   fill="currentColor" />
      <circle cx="2.5" cy="14"  r="2"   fill="currentColor" />

      {/* Connector lines from cardinal nodes to center */}
      <line x1="14" y1="5"    x2="14" y2="10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      <line x1="23.5" y1="14" x2="17.5" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      <line x1="14" y1="23"   x2="14" y2="17.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      <line x1="4.5" y1="14"  x2="10.5" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />

      {/* Diagonal secondary nodes */}
      <circle cx="7"  cy="7"  r="1.4" fill="currentColor" opacity="0.6" />
      <circle cx="21" cy="7"  r="1.4" fill="currentColor" opacity="0.6" />
      <circle cx="21" cy="21" r="1.4" fill="currentColor" opacity="0.6" />
      <circle cx="7"  cy="21" r="1.4" fill="currentColor" opacity="0.6" />

      {/* Diagonal connector lines */}
      <line x1="8.8"  y1="8.8"  x2="11.5" y2="11.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="19.2" y1="8.8"  x2="16.5" y2="11.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="19.2" y1="19.2" x2="16.5" y2="16.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="8.8"  y1="19.2" x2="11.5" y2="16.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

      {/* Center pulse core */}
      <circle cx="14" cy="14" r="4" fill="currentColor" opacity="0.15" />
      <circle cx="14" cy="14" r="2.5" fill="currentColor" />
    </svg>
  );
}

/* ── Close (X) icon ──────────────────────────────────────────────── */
function CloseIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  /* Close panel on outside click */
  useEffect(() => {
    function onMouseDown(e) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  return (
    <>
      {/* Global keyframe styles */}
      <style>{`
        @keyframes ffPulseRing {
          0%   { transform: scale(1);   opacity: 0.55; }
          60%  { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes ffShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div ref={panelRef} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>

        {/* ── Chat panel ──────────────────────────────────────── */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="ff-chat-panel"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              style={{
                position: 'absolute',
                bottom: 68,
                right: 0,
                width: 390,
                maxWidth: 'calc(100vw - 32px)',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 12px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(168,85,247,0.18)',
              }}
            >
              <AskAIChat defaultOpen />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Trigger pill button ──────────────────────────────── */}
        <div style={{ position: 'relative', display: 'inline-flex' }}>

          {/* Pulse ring — only when closed */}
          {!open && (
            <span
              style={{
                position: 'absolute', inset: 0,
                borderRadius: 9999,
                background: 'rgba(168,85,247,0.35)',
                animation: 'ffPulseRing 2.4s ease-out infinite',
                pointerEvents: 'none',
              }}
            />
          )}

          <motion.button
            onClick={() => setOpen((v) => !v)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            title={open ? 'Close AI Assistant' : 'Open FactoryFlow AI Assistant'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              padding: open ? '11px 18px 11px 14px' : '11px 18px 11px 14px',
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              position: 'relative',
              overflow: 'hidden',
              background: open
                ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #a855f7 0%, #6366f1 60%, #818cf8 100%)',
              backgroundSize: open ? '100%' : '200% auto',
              boxShadow: open
                ? '0 4px 20px rgba(99,102,241,0.5)'
                : '0 4px 24px rgba(168,85,247,0.55)',
              transition: 'background 0.3s, box-shadow 0.3s',
            }}
          >
            {/* Shimmer overlay when closed */}
            {!open && (
              <span
                style={{
                  position: 'absolute', inset: 0, borderRadius: 9999,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                  backgroundSize: '200% auto',
                  animation: 'ffShimmer 3s linear infinite',
                  pointerEvents: 'none',
                }}
              />
            )}

            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="close-icon"
                  initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
                  transition={{ duration: 0.18 }}
                  style={{ display: 'flex', flexShrink: 0 }}
                >
                  <CloseIcon size={14} />
                </motion.span>
              ) : (
                <motion.span
                  key="ai-icon"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.18 }}
                  style={{ display: 'flex', flexShrink: 0 }}
                >
                  <AIIcon size={19} />
                </motion.span>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? 'label-close' : 'label-open'}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16 }}
                style={{ position: 'relative' }}
              >
                {open ? 'Close' : 'FactoryFlow AI'}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </>
  );
}
