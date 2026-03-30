'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import API from '@/lib/api';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import { FaFilePdf, FaCheckCircle } from 'react-icons/fa';

const REPORT_SECTIONS = [
  { icon: '01', label: 'Production KPIs Summary',         desc: 'Total units, defect rates, efficiency scores' },
  { icon: '02', label: 'Efficiency & Defect Metrics',     desc: 'Department-level quality analysis'          },
  { icon: '03', label: 'Product Breakdown Analysis',      desc: 'Per-product performance breakdown'          },
  { icon: '04', label: 'AI Executive Insights',           desc: 'AI-generated strategic commentary'          },
  { icon: '05', label: 'Operational Risk Detection',      desc: 'Flagged anomalies and risk indicators'      },
  { icon: '06', label: 'Strategic Recommendations',       desc: 'Actionable improvement roadmap'            },
];

export default function ExportReport() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await API.get('/reports/export-report', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Industrial_Report.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setDownloading(false);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download report.');
      setDownloading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Page Header */}
      <div className="ff-page-header">
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e' }}
          >
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
      </div>

      {/* Main export card */}
      <div
        className="rounded-xl overflow-hidden max-w-2xl"
        style={{ background: '#17171c', border: '1px solid #1f1f28' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-4 px-6 py-5"
          style={{ borderBottom: '1px solid #1f1f28' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.10)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <DescriptionIcon style={{ fontSize: 22 }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f4', letterSpacing: '-0.01em' }}>
              AI Industrial Executive Report
            </p>
            <p style={{ fontSize: 12, color: '#54546a', marginTop: 2 }}>
              PDF · Auto-generated from live production dataset
            </p>
          </div>
        </div>

        {/* Report sections */}
        <div className="p-5">
          <p className="ff-label mb-4">Report Contents</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {REPORT_SECTIONS.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl p-3"
                style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid #1f1f28' }}
              >
                <span
                  style={{
                    fontSize: 9, fontWeight: 700, color: '#54546a',
                    fontFamily: 'JetBrains Mono, monospace',
                    background: '#1f1f28', borderRadius: 5,
                    padding: '2px 5px', flexShrink: 0,
                  }}
                >
                  {s.icon}
                </span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f4', marginBottom: 2 }}>{s.label}</p>
                  <p style={{ fontSize: 11, color: '#54546a', lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="px-5 py-4 flex items-center justify-between gap-4"
          style={{ borderTop: '1px solid #1f1f28', background: 'rgba(10,22,40,0.3)' }}
        >
          <p style={{ fontSize: 11, color: '#54546a' }}>
            Includes AI commentary from latest DBMS snapshot
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleDownload}
            disabled={downloading}
            className="ff-btn ff-btn-primary"
            style={{ flexShrink: 0 }}
          >
            {downloading ? (
              <>
                <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'white', borderTopColor: 'transparent' }} />
                Generating...
              </>
            ) : (
              <>
                <DownloadIcon style={{ fontSize: 16 }} />
                Download PDF
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Info note */}
      <div
        className="flex items-start gap-3 rounded-xl p-4 max-w-2xl"
        style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}
      >
        <FaCheckCircle size={13} style={{ color: '#10b981', marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: '#54546a', lineHeight: 1.7 }}>
          Reports are generated in real-time from the live database. All metrics are accurate to the
          latest production records. PDF generation may take a few seconds depending on dataset size.
        </p>
      </div>

    </motion.div>
  );
}
