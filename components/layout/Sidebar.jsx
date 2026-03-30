'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaTachometerAlt, FaUsers, FaIndustry, FaChartLine, FaLightbulb, FaBuilding, FaBalanceScale, FaUserTie, FaUserShield, FaHistory, FaDatabase, FaBrain, FaFilePdf, FaFlask } from 'react-icons/fa';

const NAV_SECTIONS = [
  {
    label: 'COMMAND CENTER',
    items: [
      { name: 'Executive Dashboard', path: '/', icon: FaTachometerAlt },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { name: 'Workforce', path: '/employees', icon: FaUsers },
      { name: 'Production', path: '/production', icon: FaIndustry },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { name: 'Production Monitoring', path: '/production-monitoring', icon: FaChartLine },
      { name: 'Production Insights', path: '/production-insights', icon: FaLightbulb },
      { name: 'Dept. Performance', path: '/department-performance', icon: FaBuilding },
      { name: 'Decision Support', path: '/decision-support', icon: FaBalanceScale },
    ],
  },
  {
    label: 'GOVERNANCE',
    items: [
      { name: 'Promotions', path: '/promotion-management', icon: FaUserTie },
      { name: 'Role Management', path: '/role-management', icon: FaUserShield },
      { name: 'Audit Logs', path: '/audit-logs', icon: FaHistory },
      { name: 'DBMS Impact', path: '/dbms-impact', icon: FaDatabase },
    ],
  },
  {
    label: 'REPORTS & RESEARCH',
    items: [
      { name: 'System Summary', path: '/system-summary', icon: FaBrain },
      { name: 'Export Report', path: '/export-report', icon: FaFilePdf },
      { name: 'Benchmark Lab', path: '/benchmark', icon: FaFlask },
    ],
  },
];

export default function Sidebar({ open, setOpen }) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed lg:static top-0 left-0 z-50
          w-[240px] h-full min-h-screen flex-shrink-0
          flex flex-col
          bg-[var(--bg-secondary)] border-r border-[var(--border-primary)]
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="h-14 flex items-center px-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[var(--color-info)] flex items-center justify-center">
              <FaDatabase size={14} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">FactoryFlow</div>
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">DBMS Intelligence</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx} className="mb-6">
              <div className="px-4 mb-2">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {section.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-2 text-sm
                        transition-colors
                        ${isActive
                          ? 'bg-[var(--bg-elevated)] border-l-2 border-[var(--color-info)] text-[var(--text-primary)] font-medium'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                        }
                      `}
                    >
                      <item.icon size={16} className={isActive ? 'text-[var(--color-info)]' : ''} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border-primary)]">
          <div className="industrial-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="status-dot status-active" />
              <span className="text-xs font-medium text-[var(--text-secondary)]">System Status</span>
            </div>
            <div className="text-[10px] text-[var(--text-tertiary)]">All systems operational</div>
          </div>
        </div>
      </aside>
    </>
  );
}
