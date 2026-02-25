import { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import { BarChart } from "@mui/x-charts/BarChart";
import FactoryIcon from "@mui/icons-material/Factory";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { motion } from "framer-motion";

export default function ProductionInsights() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/datasets/latest")
      .then(res => {
        setRows(res.data?.rows || []);
      })
      .catch(console.error);
  }, []);

  const clean = (val) => {
    const num = Number(String(val || 0).replace(/,/g, ""));
    return isNaN(num) ? 0 : num;
  };

  /* ================= KPIs ================= */

  const totalUnits = useMemo(
    () => rows.reduce((sum, r) => sum + clean(r.Units || r.units), 0),
    [rows]
  );

  const totalDefects = useMemo(
    () => rows.reduce((sum, r) => sum + clean(r.Defects || r.defects), 0),
    [rows]
  );

  const efficiency =
    totalUnits > 0
      ? (((totalUnits - totalDefects) / totalUnits) * 100).toFixed(1)
      : 0;

  const totalRevenue = rows.reduce(
    (sum, r) => sum + clean(r.Revenue || 0),
    0
  );

  const totalCost = rows.reduce(
    (sum, r) => sum + clean(r.Cost || 0),
    0
  );

  const profit = totalRevenue - totalCost;

  /* ================= MONTHLY BAR ================= */

  const monthlyMap = {};

  rows.forEach((r) => {
    if (!r.Date) return;

    const dateObj = new Date(r.Date);

    const key = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}`;

    if (!monthlyMap[key]) monthlyMap[key] = 0;

    monthlyMap[key] += clean(r.Units);
  });

  const sortedMonths = Object.keys(monthlyMap).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  const monthLabels = sortedMonths.map((m) => {
    const [year, month] = m.split("-");
    return new Date(year, month - 1).toLocaleString("default", {
      month: "short",
      year: "2-digit",
    });
  });

  const monthUnits = sortedMonths.map((m) => monthlyMap[m]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">

      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Production Intelligence Dashboard
        </h1>
        <p className="text-gray-500">
          Synced with uploaded dataset
        </p>
      </div>

      {/* KPI */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <Kpi icon={<FactoryIcon />} title="Total Units" value={totalUnits.toLocaleString()} />

        <Kpi icon={<WarningAmberIcon />} title="Total Defects" value={totalDefects.toLocaleString()} />

        <Kpi icon={<TrendingUpIcon />} title="Efficiency" value={`${efficiency}%`} />

        <Kpi icon={<AttachMoneyIcon />} title="Net Profit" value={`₹${profit.toLocaleString()}`} />

      </div>

      {/* Monthly Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-6 rounded-2xl shadow"
      >
        <h3 className="font-semibold mb-4">
          Monthly Production (Bar Chart)
        </h3>

        <BarChart
          height={350}
          series={[{ data: monthUnits, label: "Units" }]}
          xAxis={[{ scaleType: "band", data: monthLabels }]}
        />
      </motion.div>

    </div>
  );
}

const Kpi = ({ icon, title, value }) => (
  <div className="bg-white border rounded-2xl shadow-sm p-6 flex items-center gap-4">
    <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-xl font-bold text-gray-800">{value}</h2>
    </div>
  </div>
);