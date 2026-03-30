'use client';

import { memo, useEffect, useState } from 'react';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import useCountUp from '@/lib/hooks/useCountUp';
import KPIStatCard from '@/components/ui/KPIStatCard';
import API from '@/lib/api';
import * as C from '@/lib/cache';

const K_KPI = 'kpi-executive';
const TTL   = 30_000;

function SkeletonCard() {
  return (
    <div
      className="rounded-xl min-h-[148px]"
      style={{
        background:     'linear-gradient(90deg, #17171c 25%, rgba(255,255,255,0.015) 37%, #17171c 63%)',
        backgroundSize: '400% 100%',
        animation:      'shimmer 1.6s ease infinite',
        border:         '1px solid #1f1f28',
      }}
    />
  );
}

function KPIStats() {
  const [data,    setData]    = useState(() => C.get(K_KPI));
  const [loading, setLoading] = useState(!C.get(K_KPI));

  useEffect(() => {
    if (C.get(K_KPI)) return; // cache hit — skip fetch

    let mounted = true;
    API.get('/analytics/executive-summary')
      .then((res) => {
        C.set(K_KPI, res.data, TTL, ['kpi']);
        if (mounted) setData(res.data);
      })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  // Subscribe to KPI cache invalidation (e.g. after production CSV upload)
  useEffect(() => {
    const unsub = C.subscribe(K_KPI, () => {
      const fresh = C.get(K_KPI);
      if (fresh) { setData(fresh); setLoading(false); }
      else {
        setLoading(true);
        API.get('/analytics/executive-summary')
          .then((res) => { C.set(K_KPI, res.data, TTL, ['kpi']); setData(res.data); })
          .catch(console.error)
          .finally(() => setLoading(false));
      }
    });
    return unsub;
  }, []);

  const totalUnits   = data?.totalUnits   ?? 0;
  const totalDefects = data?.totalDefects ?? 0;
  const efficiency   = data?.efficiency   ?? 0;
  const revenue      = data?.revenue      ?? 0;

  const animUnits   = useCountUp(totalUnits);
  const animDefects = useCountUp(totalDefects);
  const animRevenue = useCountUp(revenue);

  const defectRate = totalUnits > 0
    ? ((totalDefects / totalUnits) * 100).toFixed(2)
    : '0.00';

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const stats = [
    {
      title:    'Total Units Produced',
      value:    animUnits.toLocaleString(),
      icon:     <PrecisionManufacturingIcon style={{ fontSize: 16 }} />,
      accent:   'green',
      sublabel: 'All production lines',
    },
    {
      title:    'Defective Units',
      value:    animDefects.toLocaleString(),
      icon:     <ReportProblemIcon style={{ fontSize: 16 }} />,
      accent:   'red',
      sublabel: `${defectRate}% defect rate`,
    },
    {
      title:    'Production Efficiency',
      value:    `${Number(efficiency).toFixed(2)}%`,
      icon:     <TrendingUpIcon style={{ fontSize: 16 }} />,
      accent:   'violet',
      sublabel: 'DBMS-computed KPI',
    },
    {
      title:    'Revenue Impact',
      value:    `₹${animRevenue.toLocaleString()}`,
      icon:     <AttachMoneyIcon style={{ fontSize: 16 }} />,
      accent:   'blue',
      sublabel: 'Gross output value',
    },
    {
      title:    'Defect Rate',
      value:    `${defectRate}%`,
      icon:     <BubbleChartIcon style={{ fontSize: 16 }} />,
      accent:   'amber',
      sublabel: 'Quality threshold',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <KPIStatCard key={i} {...stat} />
      ))}
    </div>
  );
}

export default memo(KPIStats);
