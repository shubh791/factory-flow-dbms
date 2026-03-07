import { useEffect, useState } from "react";
import API from "../../api/api";
import { motion } from "framer-motion";

/*
==================================================
SYSTEM SUMMARY – AI DECISION INTELLIGENCE
==================================================
*/

export default function SystemSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    try {
      setLoading(true);
      const res = await API.get("/system-summary");
      setData(res.data);
    } catch (err) {
      console.error("Summary failed", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    generateSummary();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen p-10 space-y-12"
    >
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">
          AI System Performance Intelligence
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          AI-driven evaluation of industrial performance with targeted improvement insights.
        </p>
      </div>

      {loading && (
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          Generating intelligent analysis...
        </div>
      )}

      {data && (
        <>
          {/* ================= KPI SECTION ================= */}
          <div className="bg-white p-8 rounded-3xl border shadow-sm grid md:grid-cols-3 gap-8">
            <Metric title="Employees" value={data.metrics.employeeCount} />
            <Metric title="Departments" value={data.metrics.departmentCount} />
            <Metric title="Production Records" value={data.metrics.productionRecords} />
            <Metric title="Total Units" value={data.metrics.totalUnits} />
            <Metric title="Total Defects" value={data.metrics.totalDefects} />
            <Metric title="Efficiency %" value={data.metrics.efficiency} />
          </div>

          {/* ================= AI SCORE ================= */}
          {data.analysis?.overallScore && (
            <div className="bg-white p-8 rounded-3xl border shadow-sm text-center">
              <p className="text-sm text-slate-600">AI Performance Score</p>
              <h3 className="text-4xl font-bold text-indigo-600 mt-2">
                {data.analysis.overallScore}/100
              </h3>
            </div>
          )}

          {/* ================= STRENGTHS ================= */}
          {data.analysis?.strengths?.length > 0 && (
            <SectionCard
              title="System Strengths"
              color="emerald"
              items={data.analysis.strengths}
            />
          )}

          {/* ================= RISK AREAS ================= */}
          {data.analysis?.risks?.length > 0 && (
            <SectionCard
              title="Areas Needing Improvement"
              color="red"
              items={data.analysis.risks}
            />
          )}

          {/* ================= RECOMMENDATIONS ================= */}
          {data.analysis?.recommendations?.length > 0 && (
            <SectionCard
              title="Strategic Recommendations"
              color="indigo"
              items={data.analysis.recommendations}
            />
          )}

          {/* Fallback if AI returns plain text */}
          {!data.analysis?.strengths && (
            <div className="bg-white p-8 rounded-3xl border shadow-sm">
              <h3 className="font-semibold mb-4 text-lg">
                Analytical Interpretation
              </h3>
              <div className="text-sm text-slate-700 whitespace-pre-line">
                {data.analysis}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

/* ================= METRIC CARD ================= */

const Metric = ({ title, value }) => (
  <div>
    <p className="text-sm text-slate-500">{title}</p>
    <h3 className="text-2xl font-semibold text-slate-900 mt-1">
      {value}
    </h3>
  </div>
);

/* ================= SECTION CARD ================= */

const SectionCard = ({ title, items, color }) => {
  const colorMap = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  };

  return (
    <div className={`p-8 rounded-3xl border shadow-sm ${colorMap[color]}`}>
      <h3 className="font-semibold mb-6 text-lg">{title}</h3>
      <ul className="space-y-3 text-sm">
        {items.map((item, index) => (
          <li key={index}>• {item}</li>
        ))}
      </ul>
    </div>
  );
};