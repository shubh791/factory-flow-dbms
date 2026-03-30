'use client';

import { usePathname } from 'next/navigation';
import { FaBars, FaBell, FaCircle, FaChevronRight, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '@/lib/context/ThemeContext';

const PAGE_META = {
  '/':                        { title: 'Executive Dashboard',     section: 'Command Center', tag: 'live' },
  '/employees':               { title: 'Workforce Management',    section: 'Operations'                  },
  '/production':              { title: 'Production Records',      section: 'Operations'                  },
  '/production-monitoring':   { title: 'Production Monitoring',   section: 'Analytics',      tag: 'live' },
  '/production-insights':     { title: 'Production Insights',     section: 'Analytics'                   },
  '/department-performance':  { title: 'Department Performance',  section: 'Analytics'                   },
  '/decision-support':        { title: 'Decision Support Index',  section: 'Analytics'                   },
  '/promotion-management':    { title: 'Promotion Management',    section: 'Governance'                  },
  '/role-management':         { title: 'Role Management',         section: 'Governance'                  },
  '/audit-logs':              { title: 'Audit Logs',              section: 'Governance'                  },
  '/dbms-impact':             { title: 'DBMS Impact Analysis',    section: 'Governance'                  },
  '/system-summary':          { title: 'System Summary',          section: 'Reports'                     },
  '/export-report':           { title: 'Export Reports',          section: 'Reports'                     },
  '/benchmark':               { title: 'Database Benchmark Lab',  section: 'Research',       tag: 'lab'  },
};

export default function Navbar({ setSidebarOpen }) {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: 'FactoryFlow DBMS', section: 'System' };
  const { theme, toggle } = useTheme();

  return (
    <header
      className="flex-shrink-0 h-16 flex items-center gap-4 px-4 sm:px-6 sticky top-0 z-30"
      style={{
        background: 'var(--z-900)',
        borderBottom: '1px solid var(--z-700)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.15)',
      }}
    >
      {/* Inset top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent pointer-events-none" />

      {/* Hamburger — mobile only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition flex-shrink-0"
        style={{ color: '#7878a0' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1f1f28'; e.currentTarget.style.color = '#b8b8d8'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#7878a0'; }}
      >
        <FaBars size={14} />
      </button>

      {/* Breadcrumb + title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5a5a82', fontWeight: 600 }}>FactoryFlow</span>
          <FaChevronRight size={7} style={{ color: '#3a3a5a' }} />
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5a5a82', fontWeight: 600 }}>{meta.section}</span>
          <FaChevronRight size={7} style={{ color: '#3a3a5a' }} />
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8888b0', fontWeight: 600 }}>{meta.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold truncate" style={{ color: '#f0f0f4', letterSpacing: '-0.01em' }}>
            {meta.title}
          </h1>
          {meta.tag === 'live' && (
            <span
              className="hidden sm:inline-flex items-center gap-1"
              style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10b981' }}
            >
              <FaCircle size={5} className="animate-[pulseDot_2s_ease-in-out_infinite]" />
              Live
            </span>
          )}
          {meta.tag === 'lab' && (
            <span
              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded"
              style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a855f7', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}
            >
              Research
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* System status pill */}
        <div
          className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <FaCircle size={5} style={{ color: '#10b981' }} className="animate-[pulseDot_2s_ease-in-out_infinite]" />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#10b981' }}>
            Operational
          </span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition"
          style={{ color: 'var(--t-3)', background: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--z-700)'; e.currentTarget.style.color = 'var(--t-2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--t-3)'; }}
        >
          {theme === 'dark' ? <FaSun size={13} /> : <FaMoon size={13} />}
        </button>

        {/* Notification */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition"
          style={{ color: 'var(--t-3)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--z-700)'; e.currentTarget.style.color = 'var(--t-2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--t-3)'; }}
        >
          <FaBell size={13} />
        </button>

        {/* User avatar */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#818cf8',
            boxShadow: '0 0 8px rgba(99,102,241,0.12)',
          }}
        >
          AD
        </div>
      </div>
    </header>
  );
}
