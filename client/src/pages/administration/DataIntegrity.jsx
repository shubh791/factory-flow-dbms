import { useEffect, useState, useMemo } from "react";
import API from "../../api/api";
import { motion } from "framer-motion";

/*
==================================================
ENTERPRISE DATA INTEGRITY MONITOR
==================================================
*/

export default function DataIntegrity() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get("/data-integrity")
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  const computed = useMemo(() => {
    if (!data) return null;

    const score = Number(data.score) || 0;

    const status =
      score >= 90
        ? { label: "Fully Compliant", color: "bg-emerald-500", text: "text-emerald-600" }
        : score >= 75
        ? { label: "Minor Structural Risk", color: "bg-yellow-500", text: "text-yellow-600" }
        : { label: "Integrity Breach Detected", color: "bg-red-500", text: "text-red-600" };

    return { score, status };
  }, [data]);

  if (!computed)
    return <div className="p-10">Analyzing relational constraints...</div>;

  const { score, status } = computed;

  /* Gauge Calculation */
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen p-10 space-y-14"
    >
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">
          Data Integrity & Constraint Enforcement
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Monitoring relational consistency across normalized schema.
        </p>
      </div>

      {/* INTEGRITY GAUGE */}
      <div className="bg-white rounded-3xl border shadow-sm p-12 flex flex-col md:flex-row items-center justify-between gap-12">

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
              stroke={status.color.replace("bg-", "#")}
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
              {score}
            </h3>
            <p className="text-xs text-slate-500">
              Integrity Score
            </p>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <div className={`px-4 py-2 rounded-full text-white w-fit ${status.color}`}>
            {status.label}
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Referential integrity constraints, uniqueness rules, and
            foreign key relationships are continuously validated.
            This ensures the DBMS enforces structural consistency
            beyond application-level logic.
          </p>
        </div>
      </div>

      {/* DETAILED CHECKS */}
      <div className="bg-white rounded-3xl border shadow-sm p-10 space-y-8">
        <h3 className="text-lg font-semibold text-slate-900">
          Structural Validation Checks
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <IntegrityCard
            title="Orphan Production Records"
            value={data.orphanProductions}
          />
          <IntegrityCard
            title="Employees Without Department"
            value={data.employeesWithoutDept}
          />
          <IntegrityCard
            title="Duplicate Department Codes"
            value={data.duplicateDepartments}
          />
          <IntegrityCard
            title="Duplicate Role Codes"
            value={data.duplicateRoles}
          />
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div className="bg-white rounded-3xl border shadow-sm p-8">
        <h3 className="font-semibold mb-3">Compliance Summary</h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          The relational schema enforces foreign key constraints between
          departments, employees, roles, and production records.
          Automated constraint validation prevents orphan entries,
          duplicate structural keys, and schema-level corruption.
          This demonstrates the strength of DBMS-level governance.
        </p>
      </div>
    </motion.div>
  );
}

/* ========================================================= */

const IntegrityCard = ({ title, value }) => {
  const severity =
    value === 0
      ? "text-emerald-600"
      : value < 3
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="border rounded-2xl p-6 bg-slate-50">
      <p className="text-sm text-slate-600">{title}</p>
      <h3 className={`text-2xl font-semibold mt-2 ${severity}`}>
        {value}
      </h3>
    </div>
  );
};