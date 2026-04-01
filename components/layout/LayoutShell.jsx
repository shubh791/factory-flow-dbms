'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import RouteProgress from './RouteProgress';
import dynamic from 'next/dynamic';
import { prefetch } from '@/lib/hooks/useFactoryData';

const FloatingChat = dynamic(() => import('@/components/ai/FloatingChat'), { ssr: false });

export default function LayoutShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Eagerly warm the cache for the most-visited endpoints as soon as the shell mounts
  useEffect(() => {
    prefetch([
      '/analytics/executive-summary',
      '/employees',
      '/departments',
      '/roles',
      '/production',
      '/products',
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--z-950)' }}>
      <RouteProgress />
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      <FloatingChat />
    </div>
  );
}
