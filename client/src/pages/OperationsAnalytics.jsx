import { useEffect, useState } from "react";
import API from "../api/api";
import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";

/*
==================================================
OPERATIONS PERFORMANCE ANALYSIS – DB VERSION
Fully aligned with production table
==================================================
*/

export default function OperationsAnalytics() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    API.get("/production")
      .then(res => setRecords(res.data || []))
      .catch(console.error);
  }, []);

  if (!records.length) {
    return (
      <div className="p-8 text-gray-500">
        No production records available.
      </div>
    );
  }

  /* ================= AGGREGATE BY DATE ================= */

  const dateMap = {};

  records.forEach((r) => {
    const date = new Date(r.productionDate);
    if (isNaN(date)) return;

    const key = date.toISOString().split("T")[0];

    if (!dateMap[key]) {
      dateMap[key] = { units: 0, defects: 0 };
    }

    dateMap[key].units += Number(r.units) || 0;
    dateMap[key].defects += Number(r.defects) || 0;
  });

  const sortedDates = Object.keys(dateMap).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  const unitsTrend = sortedDates.map(
    (d) => dateMap[d].units
  );

  const defectTrend = sortedDates.map(
    (d) => dateMap[d].defects
  );

  /* ================= CORE METRICS ================= */

  const totalUnits = unitsTrend.reduce((a, b) => a + b, 0);
  const totalDefects = defectTrend.reduce((a, b) => a + b, 0);

  const efficiency =
    totalUnits > 0
      ? ((totalUnits - totalDefects) / totalUnits) * 100
      : 0;

  const defectRate =
    totalUnits > 0
      ? (totalDefects / totalUnits) * 100
      : 0;

  /* ================= STABILITY INDEX ================= */

  const mean =
    unitsTrend.reduce((a, b) => a + b, 0) /
    unitsTrend.length;

  const variance =
    unitsTrend.reduce(
      (sum, val) =>
        sum + Math.pow(val - mean, 2),
      0
    ) / unitsTrend.length;

  const stdDev = Math.sqrt(variance);

  const stabilityIndex =
    mean > 0
      ? Math.max(
          0,
          100 - (stdDev / mean) * 100
        )
      : 0;

  /* ================= TREND CHART ================= */

  const trendOption = {
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: "category",
      data: sortedDates,
      axisLine: { lineStyle: { color: "#94a3b8" } },
      axisLabel: { color: "#64748b" },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#94a3b8" } },
      splitLine: { lineStyle: { color: "#e5e7eb" } },
    },
    series: [
      {
        name: "Production Units",
        type: "line",
        smooth: true,
        data: unitsTrend,
        lineStyle: { width: 3, color: "#10b981" },
        areaStyle: {
          opacity: 0.15,
          color: "#10b981",
        },
      },
      {
        name: "Defects",
        type: "line",
        smooth: true,
        data: defectTrend,
        lineStyle: { width: 2, color: "#ef4444" },
      },
    ],
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12 bg-slate-50 min-h-screen">

      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
          Operations Performance Analysis
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Performance metrics derived directly from relational DBMS records.
        </p>
      </div>

      {/* ================= KPI SECTION ================= */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

        <MetricCard
          title="Overall Efficiency"
          value={`${efficiency.toFixed(2)}%`}
        />

        <MetricCard
          title="Defect Rate"
          value={`${defectRate.toFixed(2)}%`}
        />

        <MetricCard
          title="Production Stability Index"
          value={`${stabilityIndex.toFixed(2)}%`}
        />

      </div>

      {/* ================= TREND ================= */}
      <div className="bg-white rounded-2xl shadow border p-6">
        <h3 className="font-semibold text-gray-800 mb-4">
          Production Trend (Time-Series DB Analysis)
        </h3>

        <ReactECharts
          option={trendOption}
          style={{ height: 320 }}
        />
      </div>

      {/* ================= DBMS IMPACT SECTION ================= */}
      <div className="bg-white rounded-2xl border p-6">
        <h3 className="font-semibold text-gray-800 mb-3">
          Impact of DBMS on Organisational Performance
        </h3>

        <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
          <li>Centralized relational storage ensures accurate aggregation.</li>
          <li>Time-series data enables automated trend computation.</li>
          <li>Referential integrity maintains production-data consistency.</li>
          <li>Query-driven metrics eliminate manual spreadsheet analysis.</li>
          <li>Historical tracking improves operational planning.</li>
        </ul>
      </div>

    </div>
  );
}

/* ================= CARD ================= */

function MetricCard({ title, value }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow border p-6"
    >
      <p className="text-sm text-gray-500">
        {title}
      </p>
      <h2 className="text-2xl font-semibold text-gray-800 mt-2">
        {value}
      </h2>
    </motion.div>
  );
}