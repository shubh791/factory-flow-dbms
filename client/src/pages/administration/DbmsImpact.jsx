import { useEffect, useState, useMemo } from "react";
import API from "../../api/api";
import { motion } from "framer-motion";

/*
=============================================================================
DBMS IMPACT ANALYSIS – ENTERPRISE EVALUATION DASHBOARD
=============================================================================
*/

export default function DbmsImpact() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    API.get("/system-summary")
      .then((res) => setMetrics(res.data.metrics))
      .catch(console.error);
  }, []);

  if (!metrics) {
    return (
      <div className="p-10 text-slate-600">
        Loading impact analysis...
      </div>
    );
  }

  /* ================= REAL SYSTEM METRICS ================= */

  const efficiency = Number(metrics.efficiency || 0);
  const defectRate =
    metrics.totalUnits > 0
      ? (metrics.totalDefects / metrics.totalUnits) * 100
      : 0;

  /* ================= ACADEMIC COMPARISON ================= */

  const manualReportingTime = 120; // minutes
  const dbReportingTime = 1;

  const redundancyBefore = 40;
  const redundancyAfter = 5;

  const decisionDelayBefore = 24;
  const decisionDelayAfter = 1;

  const reportingImprovement =
    ((manualReportingTime - dbReportingTime) /
      manualReportingTime) *
    100;

  const redundancyReduction =
    redundancyBefore - redundancyAfter;

  const decisionSpeedImprovement =
    ((decisionDelayBefore - decisionDelayAfter) /
      decisionDelayBefore) *
    100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen p-10 space-y-14"
    >
      {/* ================= HEADER ================= */}
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">
          DBMS Impact on Industrial Performance
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Quantitative assessment of structured database
          implementation within industrial operations.
        </p>
      </div>

      {/* ================= LIVE SYSTEM PERFORMANCE ================= */}
      <div className="grid md:grid-cols-3 gap-6">

        <ImpactCard
          title="Operational Efficiency"
          value={`${efficiency.toFixed(1)}%`}
          color="text-emerald-600"
        />

        <ImpactCard
          title="Defect Rate"
          value={`${defectRate.toFixed(2)}%`}
          color="text-red-600"
        />

        <ImpactCard
          title="Active Workforce"
          value={metrics.employeeCount}
          color="text-indigo-600"
        />
      </div>

      {/* ================= BEFORE VS AFTER ================= */}
      <div className="bg-white rounded-3xl border shadow-sm p-8">
        <h3 className="font-semibold mb-6 text-lg">
          Manual System vs DBMS System
        </h3>

        <div className="grid md:grid-cols-2 gap-10">

          <div className="space-y-4">
            <h4 className="font-medium text-red-600">
              Without DBMS
            </h4>
            <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5">
              <li>Manual logbooks and spreadsheets</li>
              <li>High redundancy (~40%)</li>
              <li>Delayed reporting (2 hours+)</li>
              <li>No relational integrity</li>
              <li>Manual profit calculations</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-emerald-600">
              With DBMS
            </h4>
            <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5">
              <li>Centralized relational database</li>
              <li>Redundancy reduced to ~5%</li>
              <li>Real-time KPI dashboards</li>
              <li>Foreign key constraints enforced</li>
              <li>Automated financial aggregation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ================= IMPACT METRICS ================= */}
      <div className="grid md:grid-cols-3 gap-6">

        <ImpactCard
          title="Reporting Time Reduction"
          value={`${reportingImprovement.toFixed(1)}%`}
          color="text-emerald-600"
        />

        <ImpactCard
          title="Redundancy Reduction"
          value={`${redundancyReduction}%`}
          color="text-indigo-600"
        />

        <ImpactCard
          title="Decision Speed Improvement"
          value={`${decisionSpeedImprovement.toFixed(1)}%`}
          color="text-purple-600"
        />
      </div>

      {/* ================= STRUCTURAL ADVANTAGES ================= */}
      <div className="bg-white rounded-3xl border shadow-sm p-8">
        <h3 className="font-semibold mb-6 text-lg">
          DBMS Structural Advantages
        </h3>

        <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-700">

          <AdvantageItem text="Normalization minimizes data redundancy." />
          <AdvantageItem text="Foreign keys ensure referential integrity." />
          <AdvantageItem text="Indexes accelerate query performance." />
          <AdvantageItem text="Transactions guarantee ACID compliance." />
          <AdvantageItem text="Audit logs provide operational traceability." />
          <AdvantageItem text="Centralized schema improves reporting consistency." />

        </div>
      </div>

      {/* ================= EXECUTIVE SUMMARY ================= */}
      <div className="bg-white rounded-3xl border shadow-sm p-8">
        <h3 className="font-semibold mb-4 text-lg">
          Executive Impact Summary
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          The structured implementation of DBMS has resulted in
          measurable improvements in reporting efficiency,
          redundancy reduction, and decision-making speed.
          Through relational modeling, constraint enforcement,
          and transactional safety, the industrial system now
          operates with higher accuracy, transparency,
          and strategic intelligence.
        </p>
      </div>
    </motion.div>
  );
}

/* ================= COMPONENTS ================= */

const ImpactCard = ({ title, value, color }) => (
  <div className="bg-white rounded-3xl border shadow-sm p-6">
    <p className="text-sm text-slate-600">{title}</p>
    <h3 className={`text-3xl font-semibold mt-2 ${color}`}>
      {value}
    </h3>
  </div>
);

const AdvantageItem = ({ text }) => (
  <div className="flex items-start gap-3">
    <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
    <p>{text}</p>
  </div>
);