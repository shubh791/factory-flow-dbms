'use client';

import { usePathname } from 'next/navigation';
import { FaBars, FaBell, FaSun, FaMoon, FaCircle } from 'react-icons/fa';
import { useTheme } from '@/lib/context/ThemeContext';

const PAGE_META = {
  '/': { title: 'Executive Dashboard', section: 'Command Center' },
  '/employees': { title: 'Workforce Management', section: 'Operations' },
  '/production': { title: 'Production Records', section: 'Operations' },
  '/production-monitoring': { title: 'Production Monitoring', section: 'Analytics' },
  '/production-insights': { title: 'Production Insights', section: 'Analytics' },
  '/department-performance': { title: 'Department Performance', section: 'Analytics' },
  '/decision-support': { title: 'Decision Support Index', section: 'Analytics' },
  '/promotion-management': { title: 'Promotion Management', section: 'Governance' },
  '/role-management': { title: 'Role Management', section: 'Governance' },
  '/audit-logs': { title: 'Audit Logs', section: 'Governance' },
  '/dbms-impact': { title: 'DBMS Impact Analysis', section: 'Governance' },
  '/system-summary': { title: 'System Summary', section: 'Reports' },
  '/export-report': { title: 'Export Reports', section: 'Reports' },
  '/benchmark': { title: 'Database Benchmark Lab', section: 'Research' },
};

export default function Navbar({ setSidebarOpen }) {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: 'FactoryFlow DBMS', section: 'System' };
  const { theme, toggle } = useTheme();

  return (
    <header className="h-14 flex items-center gap-4 px-4 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] sticky top-0 z-30">
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded"
      >
        <FaBars size={16} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span>FACTORYFLOW</span>
          <span>/</span>
          <span className="uppercase">{meta.section}</span>
        </div>
        <h1 className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{meta.title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="badge badge-success hidden sm:flex">
          <FaCircle size={6} className="status-active" />
          <span>OPERATIONAL</span>
        </div>

        <button
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
        >
          {theme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
        </button>

        <button className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors">
          <FaBell size={14} />
        </button>

        <div className="w-8 h-8 rounded bg-[var(--color-info)] flex items-center justify-center text-white text-xs font-bold">
          AD
        </div>
      </div>
    </header>
  );
}
