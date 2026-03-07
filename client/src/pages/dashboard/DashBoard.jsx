import KPIStats from "../../components/charts/KPIStats";
import ProductionChart from "../../components/charts/ProductionChart";
import EmployeeTrendChart from "../../components/charts/EmployeeTrendChart";
import EfficiencyChart from "../../components/charts/EfficiencyChart";
import ErrorRateChart from "../../components/charts/ErrorRateChart";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import API from "../../api/api";

import StorageIcon from "@mui/icons-material/Storage";
import InsightsIcon from "@mui/icons-material/Insights";
import TimelineIcon from "@mui/icons-material/Timeline";
import SpeedIcon from "@mui/icons-material/Speed";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

/*
=============================================================================
DASHBOARD – RELATIONAL DB EXECUTIVE OVERVIEW
=============================================================================
*/

export default function Dashboard() {
  const [records, setRecords] = useState([]);

  const fetchProduction = async () => {
    try {
      const res = await API.get("/production");
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Production fetch error:", err);
    }
  };

  useEffect(() => {
    fetchProduction();
  }, []);

  const totalRecords = records.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-50 min-h-screen px-8 py-10 space-y-12"
    >

      {/* HEADER */}
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          Factory Flow DBMS – Executive Dashboard
        </h1>
        <p className="text-slate-600 max-w-3xl text-sm leading-relaxed">
          Structured relational database system enabling real-time industrial analytics.
        </p>
        <p className="text-xs text-slate-400">
          Production Records in System: <strong>{totalRecords}</strong>
        </p>
      </div>

      {/* KPI SECTION */}
      <div>
        <KPIStats records={records} />
      </div>

      {/* ANALYTICS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-8">

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Operational Monitoring
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            KPI metrics derived from relational production records.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <ProductionChart records={records} />
          <EmployeeTrendChart records={records} />
          <EfficiencyChart records={records} />
          <ErrorRateChart records={records} />
        </div>
      </div>

      {/* DBMS IMPACT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">
          DBMS Contribution to Organisational Performance
        </h2>

        <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600">

          <div className="flex gap-3">
            <StorageIcon className="text-blue-600" />
            <p>Centralized storage eliminates data redundancy.</p>
          </div>

          <div className="flex gap-3">
            <AccountTreeIcon className="text-purple-600" />
            <p>Relational schema ensures referential integrity.</p>
          </div>

          <div className="flex gap-3">
            <TimelineIcon className="text-emerald-600" />
            <p>Historical tracking enables performance trend analysis.</p>
          </div>

          <div className="flex gap-3">
            <InsightsIcon className="text-orange-600" />
            <p>Automated KPI computation improves decision speed.</p>
          </div>

          <div className="flex gap-3">
            <SpeedIcon className="text-red-600" />
            <p>Optimized queries enhance operational intelligence.</p>
          </div>

        </div>
      </div>

    </motion.div>
  );
}