'use client';
/**
 * RouteProgress — thin indigo progress bar at the top of every page.
 * Triggers on pathname change (Next.js App Router navigation).
 * No external dependency required.
 */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function RouteProgress() {
  const pathname = usePathname();
  const [width,   setWidth]   = useState(0);
  const [visible, setVisible] = useState(false);
  const [done,    setDone]    = useState(false);

  useEffect(() => {
    // Reset + start
    setDone(false);
    setVisible(true);
    setWidth(0);

    const t1 = setTimeout(() => setWidth(30),  30);
    const t2 = setTimeout(() => setWidth(65),  180);
    const t3 = setTimeout(() => setWidth(85),  400);
    const t4 = setTimeout(() => setWidth(100), 600);
    const t5 = setTimeout(() => { setDone(true); setVisible(false); }, 900);

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [pathname]);

  return (
    <div
      style={{
        position:       'fixed',
        top:            0,
        left:           0,
        height:         2,
        width:          `${width}%`,
        background:     'linear-gradient(90deg, #6366f1, #818cf8, #a855f7)',
        zIndex:         9999,
        pointerEvents:  'none',
        transition:     done
          ? 'width 150ms ease, opacity 250ms 100ms'
          : 'width 400ms cubic-bezier(.4,0,.2,1)',
        opacity:        visible ? 1 : 0,
        boxShadow:      '0 0 10px rgba(99,102,241,0.6), 0 0 3px rgba(99,102,241,0.4)',
        borderRadius:   '0 2px 2px 0',
      }}
    />
  );
}
