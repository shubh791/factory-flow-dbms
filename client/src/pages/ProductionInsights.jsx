import { useEffect, useState } from "react";
import api from "../api/api";
import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";
import FactoryIcon from "@mui/icons-material/Factory";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

/*
=============================================================================
PRODUCTION INSIGHTS – ENTERPRISE API VERSION
All analytics derived from backend DB aggregation
=============================================================================
*/

export default function ProductionInsights() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/analytics/production/insights")
      .then(res => setData(res.data))
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="p-10 text-slate-500">
        Loading production intelligence...
      </div>
    );
  }

  const {
    totalUnits,
    totalDefects,
    efficiency,
    profit,
    projectedUnits,
    worstDepartment,
    monthlyTrend
  } = data;

  const option = {
    tooltip: { trigger: "axis" },
    legend: { data: ["Units", "Defects"] },
    xAxis: {
      type: "category",
      data: monthlyTrend.map(m => m.month)
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "Units",
        type: "line",
        smooth: true,
        areaStyle: {},
        data: monthlyTrend.map(m => m.units),
      },
      {
        name: "Defects",
        type: "line",
        smooth: true,
        data: monthlyTrend.map(m => m.defects),
      },
    ],
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 md:p-10 space-y-10 max-w-7xl mx-auto">

      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
          Production Intelligence & Organisational Impact
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          All insights generated directly from relational DBMS queries.
        </p>
      </div>

      {/* KPI SECTION */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Kpi icon={<FactoryIcon />} title="Total Units" value={totalUnits.toLocaleString()} />
        <Kpi icon={<WarningAmberIcon />} title="Total Defects" value={totalDefects.toLocaleString()} />
        <Kpi icon={<TrendingUpIcon />} title="Efficiency" value={`${efficiency.toFixed(2)}%`} />
        <Kpi icon={<AttachMoneyIcon />} title="Net Profit" value={`₹${profit.toLocaleString()}`} />
      </div>

      {/* FORECAST */}
      {projectedUnits && (
        <div className="bg-white border border-slate-200 p-5 rounded-xl text-sm text-slate-700">
          Projected next period output:{" "}
          <strong>{projectedUnits.toLocaleString()}</strong> units.
        </div>
      )}

      {/* WORST DEPARTMENT */}
      {worstDepartment && (
        <div className="bg-white border border-slate-200 p-5 rounded-xl text-sm text-slate-700">
          Lowest performing department:{" "}
          <strong>{worstDepartment.name}</strong>{" "}
          (Efficiency: {worstDepartment.efficiency.toFixed(1)}%)
        </div>
      )}

      {/* TREND CHART */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-slate-200 rounded-2xl p-6"
      >
        <h3 className="font-semibold text-slate-900 mb-4">
          Monthly Production & Defect Trend
        </h3>
        <ReactECharts option={option} style={{ height: 400 }} />
      </motion.div>

      {/* DBMS IMPACT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-900 mb-3">
          DBMS Impact on Organisational Performance
        </h3>
        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
          <li>Backend aggregation eliminates frontend computation overhead.</li>
          <li>Indexed date fields optimize monthly grouping queries.</li>
          <li>Referential joins ensure accurate department-level insights.</li>
          <li>Centralized analytics improves strategic planning accuracy.</li>
          <li>Query-driven KPIs accelerate executive decision-making.</li>
        </ul>
      </div>

    </div>
  );
}

const Kpi = ({ icon, title, value }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-4">
    <div className="bg-slate-100 text-slate-700 p-3 rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-slate-500 text-sm">{title}</p>
      <h2 className="text-xl font-semibold text-slate-900">{value}</h2>
    </div>
  </div>
);