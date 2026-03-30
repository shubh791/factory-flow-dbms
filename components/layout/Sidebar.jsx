'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaTachometerAlt,
  FaUsers,
  FaIndustry,
  FaChartLine,
  FaLightbulb,
  FaBuilding,
  FaBalanceScale,
  FaUserTie,
  FaUserShield,
  FaHistory,
  FaDatabase,
  FaBrain,
  FaFilePdf,
  FaTimes,
  FaCircle,
  FaLayerGroup,
  FaFlask,
} from 'react-icons/fa';

const NAV_SECTIONS = [
  {
    label: 'Command Center',
    items: [
      { name: 'Executive Dashboard', path: '/', icon: FaTachometerAlt, badge: 'live' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Workforce', path: '/employees', icon: FaUsers },
      { name: 'Production', path: '/production', icon: FaIndustry },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { name: 'Production Monitoring', path: '/production-monitoring', icon: FaChartLine },
      { name: 'Production Insights',   path: '/production-insights',   icon: FaLightbulb },
      { name: 'Dept. Performance',     path: '/department-performance', icon: FaBuilding },
      { name: 'Decision Support',      path: '/decision-support',      icon: FaBalanceScale },
    ],
  },
  {
    label: 'Governance',
    items: [
      { name: 'Promotions',      path: '/promotion-management', icon: FaUserTie   },
      { name: 'Role Management', path: '/role-management',      icon: FaUserShield },
      { name: 'Audit Logs',      path: '/audit-logs',           icon: FaHistory   },
      { name: 'DBMS Impact',     path: '/dbms-impact',          icon: FaDatabase  },
    ],
  },
  {
    label: 'Reports & Research',
    items: [
      { name: 'System Summary',  path: '/system-summary',  icon: FaBrain      },
      { name: 'Export Report',   path: '/export-report',   icon: FaFilePdf    },
      { name: 'Benchmark Lab',   path: '/benchmark',       icon: FaFlask, badge: 'new' },
    ],
  },
];

export default function Sidebar({ open, setOpen }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-50
          w-[264px] h-full min-h-screen flex-shrink-0
          flex flex-col
          transform transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{
          background: 'var(--z-900)',
          borderRight: '1px solid var(--z-700)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* Inset top shine */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent pointer-events-none" />

        {/* Logo / Brand */}
        <div
          className="flex items-center justify-between px-5 h-16 flex-shrink-0 border-b"
          style={{ borderColor: 'var(--z-700)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.1) 100%)',
                border: '1px solid rgba(99,102,241,0.35)',
                boxShadow: '0 0 12px rgba(99,102,241,0.15)',
              }}
            >
              <FaLayerGroup size={13} style={{ color: '#818cf8' }} />
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold tracking-tight" style={{ color: '#f0f0f4' }}>FactoryFlow</p>
              <p className="text-[9px] tracking-[0.14em] uppercase font-semibold" style={{ color: '#6366f1' }}>DBMS Intelligence</p>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="lg:hidden w-7 h-7 rounded-md flex items-center justify-center transition"
            style={{ color: '#7878a0' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#c0c0d8'; e.currentTarget.style.backgroundColor = '#1f1f28'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#7878a0'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <FaTimes size={11} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className="mb-4">
              {/* Section header */}
              <p
                className="px-3 pt-2 pb-1.5 text-[10px] uppercase font-bold"
                style={{ color: 'var(--t-3)', letterSpacing: '0.12em' }}
              >
                {section.label}
              </p>

              {/* Nav items */}
              <div className="space-y-0.5">
                {section.items.map((item, ii) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={ii}
                      href={item.path}
                      onClick={() => setOpen(false)}
                      className="group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150"
                      style={{
                        backgroundColor: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                        color: isActive ? '#e8e8f8' : '#8888b0',
                        boxShadow: isActive ? 'inset 0 0 0 1px rgba(99,102,241,0.18)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.06)';
                          e.currentTarget.style.color = '#b8b8d8';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#8888b0';
                        }
                      }}
                    >
                      {/* Active left indicator */}
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                          style={{ background: 'linear-gradient(180deg, #818cf8, #6366f1)' }}
                        />
                      )}

                      {/* Icon */}
                      <span
                        className="flex-shrink-0"
                        style={{ color: isActive ? '#818cf8' : '#6060a0' }}
                      >
                        <Icon size={12} />
                      </span>

                      {/* Label */}
                      <span className="flex-1 leading-none">{item.name}</span>

                      {/* Badges */}
                      {item.badge === 'live' && (
                        <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold" style={{ color: '#10b981' }}>
                          <FaCircle size={4} className="animate-[pulseDot_2s_ease-in-out_infinite]" />
                          Live
                        </span>
                      )}
                      {item.badge === 'new' && (
                        <span
                          className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(168,85,247,0.18)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}
                        >
                          New
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-4" style={{ borderTop: '1px solid var(--z-700)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.08) 100%)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: '#818cf8',
              }}
            >
              FF
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-[11px] font-semibold" style={{ color: '#a0a0c0' }}>v2.0 Release</p>
              <p className="text-[9px] truncate" style={{ color: '#4a4a6a' }}>Industrial Analytics Suite</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
