'use client';
/**
 * AIInsightPanel — reusable AI analysis panel.
 *
 * Usage:
 *   <AIInsightPanel
 *     title="Production Forecast"
 *     endpoint="/ai/predict"
 *     cacheKey="ai-predict"
 *     renderContent={(data) => <div>...</div>}
 *     icon={<FaChartLine />}
 *     color="#6366f1"
 *     autoFetch   // fetch on mount
 *   />
 */
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSyncAlt, FaBrain, FaClock } from 'react-icons/fa';
import { useAIInsights } from '@/lib/hooks/useAIInsights';

export default function AIInsightPanel({
  title,
  subtitle,
  endpoint,
  cacheKey,
  renderContent,
  icon,
  color     = '#6366f1',
  bg,
  autoFetch = false,
}) {
  const panelBg  = bg ?? `${color}0d`;
  const panelBdr = `${color}22`;
  const { data, loading, error, fetch, isCached } = useAIInsights(cacheKey);

  useEffect(() => {
    if (autoFetch && !data) {
      fetch(endpoint).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#17171c', border: '1px solid #1f1f28' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid #1f1f28' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: panelBg, color }}
          >
            {icon ?? <FaBrain size={13} />}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>{title}</p>
            {subtitle && <p style={{ fontSize: 11, color: '#54546a', marginTop: 1 }}>{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isCached && (
            <div className="flex items-center gap-1" style={{ fontSize: 10, color: '#3a3a5a' }}>
              <FaClock size={8} />
              <span>Cached</span>
            </div>
          )}
          <button
            onClick={() => fetch(endpoint)}
            disabled={loading}
            className="ff-btn ff-btn-secondary"
            style={{ padding: '5px 12px', fontSize: 11, gap: 5 }}
          >
            {loading
              ? <span className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: '#818cf8', borderTopColor: 'transparent' }} />
              : <FaSyncAlt size={9} />
            }
            {data ? 'Refresh' : 'Run AI'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {loading && !data && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 py-4"
            >
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                style={{ borderColor: `${color}60`, borderTopColor: color }}
              />
              <p style={{ fontSize: 12, color: '#54546a' }}>Running AI analysis…</p>
            </motion.div>
          )}

          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-lg px-4 py-3"
              style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}
            >
              <p style={{ fontSize: 12, color: '#f87191' }}>{error}</p>
            </motion.div>
          )}

          {!data && !loading && !error && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: panelBg }}>
                <FaBrain size={16} style={{ color }} />
              </div>
              <p style={{ fontSize: 13, color: '#f0f0f4', fontWeight: 500, marginBottom: 6 }}>
                AI analysis not yet generated
              </p>
              <p style={{ fontSize: 11, color: '#54546a' }}>
                Click <strong style={{ color: '#818cf8' }}>Run AI</strong> to generate insights
              </p>
            </motion.div>
          )}

          {data && !loading && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {renderContent(data)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
