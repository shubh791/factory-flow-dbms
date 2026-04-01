'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import API from '@/lib/api';
import { FaFilePdf, FaCheckCircle, FaDownload, FaChartBar, FaUsers, FaShieldAlt, FaBrain, FaTable, FaMoneyBillWave } from 'react-icons/fa';

const REPORT_SECTIONS = [
  { num: '01', icon: FaChartBar,        label: 'Executive KPI Summary',       desc: 'Total units, defect rates, efficiency scores',       color: '#059669' },
  { num: '02', icon: FaTable,           label: 'Monthly Production Trend',    desc: 'Month-over-month output, defects & revenue',         color: '#6366f1' },
  { num: '03', icon: FaChartBar,        label: 'Product Breakdown Analysis',  desc: 'Per-product performance, quality & revenue',         color: '#7c3aed' },
  { num: '04', icon: FaShieldAlt,       label: 'Department Performance',      desc: 'Dept-level efficiency, headcount & revenue',         color: '#0d9488' },
  { num: '05', icon: FaUsers,           label: 'Workforce Analytics',         desc: 'Headcount, top producers, promotions',               color: '#2563eb' },
  { num: '06', icon: FaMoneyBillWave,   label: 'Financial Summary',           desc: 'Revenue, cost, profit margin by department',         color: '#d97706' },
  { num: '07', icon: FaShieldAlt,       label: 'Defect & Risk Analysis',      desc: 'Flagged anomalies, risk levels, quality risks',      color: '#dc2626' },
  { num: '08', icon: FaBrain,           label: 'AI Strategic Insights',       desc: 'AI-generated strengths & recommendations',           color: '#a855f7' },
];

const stagger = { animate: { transition: { staggerChildren: 0.05 } } };
const fadeUp  = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function ExportReport() {
  const [downloading, setDownloading] = useState(false);
  const [done,        setDone]        = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDone(false);
      const response = await API.get('/reports/export-report', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FactoryFlow_Report_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6 max-w-3xl">

      {/* Page Header */}
      <motion.div variants={fadeUp} className="ff-page-header">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e' }}>
            <FaFilePdf size={13} />
          </div>
          <p className="ff-label">Reports · Export Suite</p>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.02em' }}>
          Export Reports
        </h1>
        <p style={{ fontSize: 12, color: '#54546a', marginTop: 4 }}>
          Generate enterprise-grade PDF reports powered by industrial AI analytics
        </p>
      </motion.div>

      {/* Main card */}
      <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}>

        {/* Card header */}
        <div className="flex items-center gap-4 px-6 py-5" style={{ borderBottom: '1px solid #1f1f28' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <FaFilePdf size={20} style={{ color: '#818cf8' }} />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f4', letterSpacing: '-0.01em' }}>
              AI Industrial Executive Report
            </p>
            <p style={{ fontSize: 12, color: '#54546a', marginTop: 3 }}>
              Professional PDF · 9 pages · Auto-generated from live production dataset
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>Live Data</span>
          </div>
        </div>

        {/* Report contents */}
        <div className="p-6">
          <p className="ff-label mb-4">Report Contents</p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {REPORT_SECTIONS.map((s, i) => (
              <motion.div key={i} variants={fadeUp}
                className="flex items-center gap-3 rounded-xl p-3.5"
                style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid #1f1f28' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}14`, border: `1px solid ${s.color}28` }}>
                  <s.icon size={12} style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#3a3a5a', fontWeight: 700 }}>{s.num}</span>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f4' }}>{s.label}</p>
                  </div>
                  <p style={{ fontSize: 10.5, color: '#54546a', marginTop: 1, lineHeight: 1.4 }}>{s.desc}</p>
                </div>
                <FaCheckCircle size={11} style={{ color: '#3a3a5a', flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA bar */}
        <div className="px-6 py-4 flex items-center justify-between gap-4"
          style={{ borderTop: '1px solid #1f1f28', background: 'rgba(0,0,0,0.15)' }}>
          <div>
            <p style={{ fontSize: 12, color: '#9090a4', fontWeight: 500 }}>
              Includes AI commentary from Groq · llama-3.1-8b-instant
            </p>
            <p style={{ fontSize: 11, color: '#3a3a5a', marginTop: 2 }}>
              Generation may take 5–15 seconds depending on dataset size
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2.5 rounded-xl px-5 py-3 font-semibold flex-shrink-0"
            style={{
              background: done
                ? 'rgba(16,185,129,0.15)'
                : downloading
                ? 'rgba(99,102,241,0.2)'
                : 'linear-gradient(135deg, #6366f1, #818cf8)',
              border: done
                ? '1px solid rgba(16,185,129,0.3)'
                : '1px solid rgba(99,102,241,0.3)',
              color: done ? '#10b981' : '#fff',
              fontSize: 13,
              cursor: downloading ? 'not-allowed' : 'pointer',
              opacity: downloading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {downloading ? (
              <>
                <span className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                <span>Generating…</span>
              </>
            ) : done ? (
              <>
                <FaCheckCircle size={14} />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <FaDownload size={13} />
                <span>Download PDF</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* What's included info */}
      <motion.div variants={fadeUp}
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.14)' }}>
        <div style={{ width: 3, height: '100%', minHeight: 40, borderRadius: 2, background: '#6366f1', flexShrink: 0, alignSelf: 'stretch' }} />
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', marginBottom: 4 }}>What's in this report</p>
          <p style={{ fontSize: 11.5, color: '#54546a', lineHeight: 1.7 }}>
            Reports are generated in real-time from the live database. All metrics are accurate to the
            latest production records. The PDF uses a clean professional white layout with colored
            accents — optimized for printing and sharing with stakeholders.
          </p>
        </div>
      </motion.div>

    </motion.div>
  );
}
