'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import API from '@/lib/api';
import dynamic from 'next/dynamic';
import { FaBuilding } from 'react-icons/fa';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export default function DepartmentPerformance() {
  const [departmentStats, setDepartmentStats] = useState([]);

  useEffect(() => {
    API.get('/analytics/department/performance')
      .then((res) => setDepartmentStats(res.data || []))
      .catch(console.error);
  }, []);

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f1f28',
      borderColor: '#3a3a4a',
      borderWidth: 1,
      textStyle: { color: '#f0f0f4', fontSize: 12 },
    },
    legend: {
      data: ['Total Units', 'Efficiency %'],
      textStyle: { color: '#9090a4', fontSize: 11 },
      top: 8,
    },
    grid: { left: 60, right: 60, top: 48, bottom: 40 },
    xAxis: {
      type: 'category',
      data: departmentStats.map((d) => d.department),
      axisLabel: { color: '#9090a4', fontSize: 11 },
      axisLine: { lineStyle: { color: '#2c2c38' } },
      axisTick: { lineStyle: { color: '#2c2c38' } },
    },
    yAxis: [
      {
        type: 'value', name: 'Units',
        nameTextStyle: { color: '#54546a', fontSize: 10 },
        axisLabel: { color: '#54546a', fontSize: 11 },
        splitLine: { lineStyle: { color: '#1f1f28', type: 'dashed' } },
        axisLine: { show: false },
      },
      {
        type: 'value', name: 'Efficiency %', max: 100,
        nameTextStyle: { color: '#54546a', fontSize: 10 },
        axisLabel: { color: '#54546a', fontSize: 11 },
        splitLine: { show: false },
        axisLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Total Units', type: 'bar',
        data: departmentStats.map((d) => d.units),
        barWidth: 28,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: 'rgba(99,102,241,0.4)' }] },
        },
      },
      {
        name: 'Efficiency %', type: 'line', yAxisIndex: 1,
        smooth: true, symbol: 'circle', symbolSize: 6,
        data: departmentStats.map((d) => d.efficiency),
        lineStyle: { color: '#10b981', width: 2.5 },
        itemStyle: { color: '#10b981', borderColor: '#111116', borderWidth: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.15)' }, { offset: 1, color: 'rgba(16,185,129,0)' }] },
        },
      },
    ],
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Page Header */}
      <div className="ff-page-header">
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8' }}
          >
            <FaBuilding size={13} />
          </div>
          <p className="ff-label">Analytics · Department Intelligence</p>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.02em' }}>
          Department Performance Intelligence
        </h1>
        <p style={{ fontSize: 12, color: '#54546a', marginTop: 4 }}>
          Cross-department analytics generated directly from relational DBMS queries
        </p>
      </div>

      {/* Stats Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Department Statistics</p>
          <p style={{ fontSize: 11, color: '#54546a', marginTop: 2 }}>Aggregated from normalized production records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 680 }}>
            <thead>
              <tr style={{ background: '#17171c', borderBottom: '1px solid #2c2c38' }}>
                {['Department', 'Employees', 'Avg Experience', 'Total Units', 'Defects', 'Efficiency'].map((h) => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 600, color: '#54546a' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((dept, i) => {
                const eff = Number(dept.efficiency);
                const effColor = eff >= 98 ? '#10b981' : eff >= 95 ? '#fbbf24' : '#f43f5e';
                return (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid #1f1f28', transition: 'background 150ms' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>{dept.department}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#9090a4' }}>{dept.employees}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#9090a4' }}>{dept.avgExperience} yrs</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: '#f0f0f4', fontFamily: 'JetBrains Mono, monospace' }}>
                      {dept.units.toLocaleString()}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#f43f5e', fontFamily: 'JetBrains Mono, monospace' }}>
                      {dept.defects.toLocaleString()}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: effColor, fontFamily: 'JetBrains Mono, monospace' }}>
                        {dept.efficiency}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {departmentStats.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#54546a' }}>
                    No department data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      {departmentStats.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: '#17171c', border: '1px solid #1f1f28' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f1f28' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f4' }}>Department Efficiency Analysis</p>
            <p style={{ fontSize: 11, color: '#54546a', marginTop: 2 }}>Units output vs efficiency % by department</p>
          </div>
          <div className="p-5">
            <ReactECharts option={chartOption} style={{ height: 380 }} />
          </div>
        </div>
      )}

    </motion.div>
  );
}
