import { useEffect, useState } from "react";
import API from "../api/api";
import { motion } from "framer-motion";

import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";

/*
==================================================
OPERATIONS ANALYTICS PAGE
- Uses same dataset as dashboard
- Fully responsive SaaS UI
- Animated KPI cards
- Clean charts
- Central API usage
==================================================
*/

export default function OperationsAnalytics() {
  const [dataset, setDataset] = useState(null);

  /* ================= LOAD DATASET ================= */
  useEffect(() => {
    API.get("/datasets/latest").then(res => {
      if (!res.data) return;

      setDataset({
        ...res.data,
        rows: res.data.rows || [],
      });
    });
  }, []);

  if (!dataset?.rows?.length)
    return (
      <div className="p-10 text-gray-500">
        No dataset uploaded.
      </div>
    );

  const rows = dataset.rows;

  /* ================= COLUMN DETECTION ================= */

  const cleanNumber = val => {
    const num = Number(String(val).replace(/,/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const numericColumns = Object.keys(rows[0]).filter(key =>
    rows.slice(0, 40).some(r => !isNaN(cleanNumber(r[key])))
  );

  const unitColumn =
    numericColumns.find(c => c.toLowerCase().includes("unit")) ||
    numericColumns[0];

  const defectColumn =
    numericColumns.find(c => c.toLowerCase().includes("defect")) ||
    numericColumns[1];

  const labelColumn = Object.keys(rows[0]).find(
    k => k !== unitColumn && k !== defectColumn
  );

  /* ================= KPI CALCULATIONS ================= */

  let totalUnits = 0;
  let totalDefects = 0;

  rows.forEach(r => {
    totalUnits += cleanNumber(r[unitColumn]);
    totalDefects += cleanNumber(r[defectColumn]);
  });

  const efficiency =
    totalUnits > 0
      ? ((totalUnits - totalDefects) / totalUnits) * 100
      : 0;

  const defectRate =
    totalUnits > 0
      ? (totalDefects / totalUnits) * 100
      : 0;

  /* ================= PRODUCT GROUPING ================= */

  const productMap = {};

  rows.forEach(r => {
    const name = r[labelColumn] || "Unknown";

    if (!productMap[name]) {
      productMap[name] = { units: 0, defects: 0 };
    }

    productMap[name].units += cleanNumber(r[unitColumn]);
    productMap[name].defects += cleanNumber(r[defectColumn]);
  });

  const productNames = Object.keys(productMap);
  const productUnits = productNames.map(p => productMap[p].units);
  const productDefects = productNames.map(p => productMap[p].defects);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-10"
    >
      {/* ================= PAGE TITLE ================= */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
        Operations Analytics
      </h1>

      {/* ================= KPI CARDS ================= */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI title="Total Production" value={totalUnits.toLocaleString()} />
        <KPI title="Total Defects" value={totalDefects.toLocaleString()} />
        <KPI title="Efficiency" value={`${efficiency.toFixed(2)}%`} />
        <KPI title="Defect Rate" value={`${defectRate.toFixed(2)}%`} />
      </div>

      {/* ================= CHARTS GRID ================= */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* BAR CHART */}
        <ChartCard title="Product Output">
          <BarChart
            height={300}
            series={[{ data: productUnits, label: "Units" }]}
            xAxis={[{ scaleType: "band", data: productNames }]}
          />
        </ChartCard>

        {/* PIE CHART */}
        <ChartCard title="Defect Distribution">
          <PieChart
            height={300}
            series={[
              {
                data: productNames.map((name, i) => ({
                  id: i,
                  value: productDefects[i],
                  label: name,
                })),
                innerRadius: 70,
              },
            ]}
          />
        </ChartCard>
      </div>

      {/* ================= LINE TREND ================= */}
      <ChartCard title="Production Trend">
        <LineChart
          height={320}
          series={[
            {
              data: productUnits,
              label: "Units",
              area: true,
              showMark: false,
            },
          ]}
          xAxis={[{ scaleType: "point", data: productNames }]}
        />
      </ChartCard>
    </motion.div>
  );
}

/* ==================================================
   KPI CARD COMPONENT
================================================== */
function KPI({ title, value }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white rounded-2xl shadow border p-6"
    >
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-2xl font-bold text-gray-800 mt-2">
        {value}
      </h2>
    </motion.div>
  );
}

/* ==================================================
   CHART CARD WRAPPER
================================================== */
function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow border p-6">
      <h3 className="font-semibold mb-4 text-gray-800">
        {title}
      </h3>
      {children}
    </div>
  );
}