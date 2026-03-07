import { useEffect, useState, useMemo } from "react";
import API from "../../api/api";
import { motion } from "framer-motion";

/*
=============================================================================
INDUSTRIAL DECISION INTELLIGENCE – ENTERPRISE UPGRADE
=============================================================================
*/

export default function DecisionSupport() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    API.get("/system-summary")
      .then((res) => setMetrics(res.data.metrics))
      .catch(console.error);
  }, []);

  const calculated = useMemo(() => {
    if (!metrics) return null;

    const totalUnits = metrics.totalUnits || 0;
    const totalDefects = metrics.totalDefects || 0;

    const efficiencyScore = Number(metrics.efficiency) || 0;

    const qualityScore =
      totalUnits > 0
        ? 100 - (totalDefects / totalUnits) * 100
        : 0;

    const workforceScore =
      metrics.employeeCount > 0 ? 85 : 60;

    const financialScore =
      totalUnits > 0 ? 90 : 70;

    const IPI = (
      efficiencyScore * 0.3 +
      qualityScore * 0.25 +
      workforceScore * 0.2 +
      financialScore * 0.25
    );

    return {
      efficiencyScore,
      qualityScore,
      workforceScore,
      financialScore,
      IPI: Number(IPI.toFixed(0)),
    };
  }, [metrics]);

  if (!calculated)
    return <div className="p-10">Generating executive analytics...</div>;

  const {
    efficiencyScore,
    qualityScore,
    workforceScore,
    financialScore,
    IPI,
  } = calculated;

  /* ================= STATUS ================= */

  const status =
    IPI >= 85
      ? {
          label: "Optimized Operations",
          badge: "bg-emerald-100 text-emerald-700",
          stroke: "#10b981",
        }
      : IPI >= 70
      ? {
          label: "Moderate Risk Zone",
          badge: "bg-yellow-100 text-yellow-700",
          stroke: "#eab308",
        }
      : {
          label: "Operational Risk",
          badge: "bg-red-100 text-red-700",
          stroke: "#ef4444",
        };

  /* ================= GAUGE ================= */

  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (IPI / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen p-10 space-y-14"
    >
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">
          Industrial Decision Intelligence
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Strategic executive abstraction powered by relational DBMS analytics.
        </p>
      </div>

      {/* EXECUTIVE SCORE CARD */}
      <div className="bg-white rounded-3xl border shadow-sm p-12 flex flex-col md:flex-row items-center justify-between gap-12">

        {/* Animated Gauge */}
        <div className="relative">
          <svg width="220" height="220">
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="#e2e8f0"
              strokeWidth="18"
              fill="transparent"
            />
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke={status.stroke}
              strokeWidth="18"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h3 className="text-4xl font-bold text-slate-900">
              {IPI}
            </h3>
            <p className="text-xs text-slate-500">
              Performance Index
            </p>
          </div>
        </div>

        {/* Executive Explanation */}
        <div className="max-w-md space-y-4">
          <div className={`px-4 py-2 rounded-full text-sm font-medium w-fit ${status.badge}`}>
            {status.label}
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            The Industrial Performance Index integrates efficiency,
            quality management, workforce stability, and financial
            resilience into a unified strategic metric derived from
            normalized relational schema.
          </p>
        </div>
      </div>

      {/* STRATEGIC PILLAR VISUALIZATION */}
      <div className="bg-white rounded-3xl border shadow-sm p-10 space-y-8">
        <h3 className="text-lg font-semibold text-slate-900">
          Strategic Pillar Contribution
        </h3>

        <PillarBar title="Operational Efficiency" value={efficiencyScore} />
        <PillarBar title="Quality Control" value={qualityScore} />
        <PillarBar title="Workforce Stability" value={workforceScore} />
        <PillarBar title="Financial Strength" value={financialScore} />
      </div>

      {/* STRATEGIC INSIGHT */}
      <div className="bg-white rounded-3xl border shadow-sm p-8">
        <h3 className="font-semibold mb-3">Executive Insight</h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          High index values indicate stable throughput, controlled defect ratios,
          and optimized workforce alignment. Lower index signals require
          immediate inspection of department-level inefficiencies and quality drift.
          Structured DBMS aggregation enables real-time executive response.
        </p>
      </div>
    </motion.div>
  );
}

/* =========================================================
   Animated Pillar Bar
========================================================= */

const PillarBar = ({ title, value }) => {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-600">{title}</span>
        <span className="font-medium text-slate-900">
          {value.toFixed(1)}%
        </span>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
          className="h-4 rounded-full bg-slate-900"
        />
      </div>
    </div>
  );
};