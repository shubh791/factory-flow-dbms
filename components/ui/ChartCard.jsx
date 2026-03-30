'use client';

/**
 * ChartCard — reusable card wrapper for charts.
 * Props:
 *   title      — card header title
 *   subtitle   — optional subtitle
 *   badge      — optional badge text (string)
 *   badgeColor — 'blue' | 'green' | 'amber' | 'red' | 'violet' (default blue)
 *   actions    — optional JSX for header right side
 *   footer     — optional JSX for footer stats row
 *   noPadding  — skip body padding (for edge-to-edge charts)
 *   icon       — optional icon JSX shown in header
 *   children
 */
export default function ChartCard({
  title,
  subtitle,
  badge,
  badgeColor = 'blue',
  actions,
  footer,
  noPadding = false,
  icon,
  children,
}) {
  const badgeStyles = {
    blue:   { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8',  border: 'rgba(99,102,241,0.25)'  },
    green:  { bg: 'rgba(16,185,129,0.12)',  color: '#10b981',  border: 'rgba(16,185,129,0.25)'  },
    amber:  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b',  border: 'rgba(245,158,11,0.25)'  },
    red:    { bg: 'rgba(244,63,94,0.12)',   color: '#f43f5e',  border: 'rgba(244,63,94,0.25)'   },
    violet: { bg: 'rgba(168,85,247,0.12)',  color: '#a855f7',  border: 'rgba(168,85,247,0.25)'  },
  };
  const bs = badgeStyles[badgeColor] ?? badgeStyles.blue;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: '#17171c',
        border: '1px solid #1f1f28',
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)',
      }}
    >
      {/* Top shine */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }}
      />

      {/* Header */}
      {(title || badge || actions) && (
        <div
          className="flex items-center justify-between gap-4 px-5 py-4"
          style={{ borderBottom: '1px solid #1f1f28' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8' }}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <p
                  className="text-[13px] font-semibold truncate"
                  style={{ color: '#f0f0f4', letterSpacing: '-0.01em' }}
                >
                  {title}
                </p>
              )}
              {subtitle && (
                <p className="text-[11px] truncate mt-0.5" style={{ color: '#54546a' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {badge && (
              <span
                className="inline-flex items-center text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded-full"
                style={{
                  background: bs.bg,
                  color: bs.color,
                  border: `1px solid ${bs.border}`,
                }}
              >
                {badge}
              </span>
            )}
            {actions}
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ padding: noPadding ? 0 : '20px' }}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div
          style={{
            borderTop: '1px solid #1f1f28',
            padding: '14px 20px',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
