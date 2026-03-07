import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import API from "../../api/api";

import SystemStatusBadge from "../production/SystemStatusBadge";

import {
  Storage,
  Insights,
  Speed,
  Timeline,
} from "@mui/icons-material";

import { generateProductionInsights } from "../../analytics/productionEngine";

/*
=============================================================================
PRODUCTION MONITORING – ENTERPRISE DBMS VERSION
Clean | Aggregated | No Charts | Industrial Intelligence
=============================================================================
*/

export default function ProductionMonitoring() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH FROM DB ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/production");
        setRecords(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load production:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ================= ANALYTICS ================= */
  const insights = useMemo(() => {
    return generateProductionInsights(records);
  }, [records]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        Loading production intelligence...
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        No structured production records found.
      </div>
    );
  }

  const {
    totalUnits,
    totalDefects,
    stability,
    forecast,
    status,
  } = insights;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-50 min-h-screen p-10 space-y-14"
    >
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Production Intelligence Console
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Real-time operational analytics derived from centralized relational DBMS architecture.
          </p>
        </div>

        <SystemStatusBadge status={status} />
      </div>

      {/* ================= KPI SECTION ================= */}
      <div className="grid md:grid-cols-3 gap-8">
        <MetricCard
          icon={<Storage fontSize="small" />}
          title="Total Production Units"
          value={totalUnits.toLocaleString()}
          accent="emerald"
        />

        <MetricCard
          icon={<Insights fontSize="small" />}
          title="Total Defective Units"
          value={totalDefects.toLocaleString()}
          accent="red"
        />

        <MetricCard
          icon={<Speed fontSize="small" />}
          title="Operational Stability Index"
          value={`${stability}%`}
          accent="blue"
        />
      </div>

      {/* ================= DEPARTMENT TABLE ================= */}
     

      {/* ================= FORECAST ================= */}
      {forecast > 0 && (
        <div className="rounded-3xl p-8 border border-indigo-100 shadow-md bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
          <h2 className="text-lg font-semibold mb-4 text-slate-900">
            Predictive Production Forecast
          </h2>

          <p className="text-sm text-slate-700">
            Based on structured time-series modeling from normalized production records,
            projected short-term output is approximately{" "}
            <strong className="text-indigo-600">
              {forecast.toLocaleString()}
            </strong>{" "}
            units.
          </p>
        </div>
      )}

      {/* ================= DBMS IMPACT ================= */}
      <div className="rounded-3xl p-10 border border-slate-200 shadow-md bg-white">
        <h2 className="text-xl font-semibold mb-10 text-slate-900">
          DBMS Impact on Industrial Monitoring
        </h2>

        <div className="grid md:grid-cols-2 gap-10 text-sm text-slate-600">
          <ImpactItem
            icon={<Timeline className="text-blue-600" />}
            title="Structured Time-Series Intelligence"
            desc="Indexed productionDate fields enable fast chronological aggregation."
          />

          <ImpactItem
            icon={<Storage className="text-emerald-600" />}
            title="Referential Data Integrity"
            desc="Relational links eliminate redundancy and preserve accuracy."
          />

          <ImpactItem
            icon={<Insights className="text-purple-600" />}
            title="Automated KPI Computation"
            desc="Aggregations derived from DB queries remove spreadsheet dependency."
          />

          <ImpactItem
            icon={<Speed className="text-orange-600" />}
            title="Operational Decision Acceleration"
            desc="Query-driven analytics improve industrial response time."
          />
        </div>
      </div>
    </motion.div>
  );
}


/* ================= METRIC CARD ================= */
function MetricCard({ icon, title, value, accent }) {
  const accentMap = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-600",
    red: "border-red-100 bg-red-50 text-red-600",
    blue: "border-blue-100 bg-blue-50 text-blue-600",
  };

  return (
    <div className={`rounded-3xl p-6 border shadow-md ${accentMap[accent]}`}>
      <div className="flex items-center gap-3 mb-4 text-sm">
        <div className="p-2 bg-white rounded-xl shadow-sm">{icon}</div>
        <span className="font-medium">{title}</span>
      </div>

      <h2 className="text-3xl font-semibold">{value}</h2>
    </div>
  );
}

/* ================= IMPACT ITEM ================= */
function ImpactItem({ icon, title, desc }) {
  return (
    <div className="flex gap-4">
      {icon}
      <div>
        <h4 className="font-medium text-slate-800 mb-2">{title}</h4>
        <p>{desc}</p>
      </div>
    </div>
  );
}