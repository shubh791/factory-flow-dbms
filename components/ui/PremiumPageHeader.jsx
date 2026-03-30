'use client';

import { motion } from 'framer-motion';
import { FaCircle } from 'react-icons/fa';

export default function PremiumPageHeader({ 
  title, 
  description, 
  badge, 
  badgeColor = '#6366f1',
  stats,
  actions 
}) {
  const fadeUp = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className="mb-8 pb-6"
      style={{ borderBottom: '1px solid var(--z-600)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-3">
          {badge && (
            <div className="flex items-center gap-2.5">
              <span 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider"
                style={{ 
                  background: `${badgeColor}15`, 
                  color: badgeColor,
                  border: `1px solid ${badgeColor}30`
                }}
              >
                <FaCircle size={5} className="animate-[pulseDot_2s_ease-in-out_infinite]" />
                {badge}
              </span>
            </div>
          )}
          
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ 
              color: 'var(--t-hi)', 
              letterSpacing: '-0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            {title}
          </h1>
          
          {description && (
            <p className="text-sm max-w-2xl" style={{ color: 'var(--t-2)', lineHeight: 1.6 }}>
              {description}
            </p>
          )}

          {stats && stats.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {stats.map((stat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--t-3)' }}>
                    {stat.label}
                  </span>
                  <span className="text-sm font-bold" style={{ color: stat.color || 'var(--t-1)' }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}
