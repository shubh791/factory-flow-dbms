'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

const ACCENT_THEMES = {
  green: {
    accent:    '#10b981',
    accentEnd: '#34d399',
    iconBg:    'rgba(16,185,129,0.12)',
    iconColor: '#10b981',
    glow:      'rgba(16,185,129,0.06)',
    trendUp:   '#10b981',
    trendDown: '#f43f5e',
  },
  red: {
    accent:    '#f43f5e',
    accentEnd: '#fb7185',
    iconBg:    'rgba(244,63,94,0.12)',
    iconColor: '#f43f5e',
    glow:      'rgba(244,63,94,0.06)',
    trendUp:   '#f43f5e',
    trendDown: '#10b981',
  },
  blue: {
    accent:    '#6366f1',
    accentEnd: '#818cf8',
    iconBg:    'rgba(99,102,241,0.12)',
    iconColor: '#818cf8',
    glow:      'rgba(99,102,241,0.06)',
    trendUp:   '#10b981',
    trendDown: '#f43f5e',
  },
  violet: {
    accent:    '#a855f7',
    accentEnd: '#c084fc',
    iconBg:    'rgba(168,85,247,0.12)',
    iconColor: '#a855f7',
    glow:      'rgba(168,85,247,0.06)',
    trendUp:   '#10b981',
    trendDown: '#f43f5e',
  },
  amber: {
    accent:    '#f59e0b',
    accentEnd: '#fbbf24',
    iconBg:    'rgba(245,158,11,0.12)',
    iconColor: '#f59e0b',
    glow:      'rgba(245,158,11,0.06)',
    trendUp:   '#10b981',
    trendDown: '#f43f5e',
  },
  teal: {
    accent:    '#14b8a6',
    accentEnd: '#2dd4bf',
    iconBg:    'rgba(20,184,166,0.12)',
    iconColor: '#14b8a6',
    glow:      'rgba(20,184,166,0.06)',
    trendUp:   '#10b981',
    trendDown: '#f43f5e',
  },
};

// Legacy accent class string → theme key
const legacyMap = {
  'bg-green-100 text-green-700':   'green',
  'bg-red-100 text-red-700':       'red',
  'bg-indigo-100 text-indigo-700': 'violet',
  'bg-blue-100 text-blue-700':     'blue',
  'bg-orange-100 text-orange-700': 'amber',
};

function KPIStatCard({ title, value, icon, accent, trend, delta, sublabel }) {
  const themeKey = legacyMap[accent] ?? accent ?? 'blue';
  const theme = ACCENT_THEMES[themeKey] ?? ACCENT_THEMES.blue;

  const trendUp = trend === 'up';
  const trendDown = trend === 'down';
  const trendColor = trendUp ? theme.trendUp : trendDown ? theme.trendDown : '#54546a';
  const TrendIcon = trendUp ? FaArrowUp : trendDown ? FaArrowDown : FaMinus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      className="relative flex flex-col justify-between min-h-[148px] rounded-xl overflow-hidden cursor-default"
      style={{
        background: '#17171c',
        border: '1px solid #1f1f28',
        boxShadow: '0 1px 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)',
        padding: '0',
        transition: 'border-color 200ms, box-shadow 200ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#2c2c38';
        e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.45), 0 0 0 1px ${theme.accent}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1f1f28';
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)';
      }}
    >
      {/* Gradient top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentEnd})`,
          borderRadius: '12px 12px 0 0',
        }}
      />

      {/* Subtle radial glow from accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-16 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${theme.glow}, transparent)`,
        }}
      />

      {/* Card content */}
      <div className="relative flex flex-col justify-between h-full p-5 pt-[18px]">
        {/* Top row: label + icon */}
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest leading-tight flex-1"
            style={{ color: '#54546a', marginTop: 2 }}
          >
            {title}
          </p>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: theme.iconBg, color: theme.iconColor }}
          >
            <span style={{ fontSize: 13 }}>{icon}</span>
          </div>
        </div>

        {/* Middle: big value */}
        <div className="mt-4">
          <p
            className="text-[26px] font-semibold tracking-tight leading-none"
            style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace', color: '#f0f0f4' }}
          >
            {value}
          </p>
          {sublabel && (
            <p className="mt-1.5 text-[10px]" style={{ color: '#54546a' }}>{sublabel}</p>
          )}
        </div>

        {/* Bottom: trend badge */}
        {trend && delta && (
          <div className="mt-3">
            <div
              className="inline-flex items-center gap-1 text-[10px] font-bold rounded-md px-2 py-1"
              style={{
                color: trendColor,
                background: `${trendColor}14`,
                border: `1px solid ${trendColor}28`,
              }}
            >
              <TrendIcon size={8} />
              <span>{delta}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default memo(KPIStatCard);
