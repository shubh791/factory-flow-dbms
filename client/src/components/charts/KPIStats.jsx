import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import StorageIcon from "@mui/icons-material/Storage";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import InsightsIcon from "@mui/icons-material/Insights";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";

export default function KPIStats({ dataset }) {
  const rows = dataset?.rows || [];

  /* CLEAN NUMBER HANDLER */
  const cleanNumber = (val) => {
    if (val === null || val === undefined) return 0;
    const num = Number(String(val).replace(/,/g, "").trim());
    return isNaN(num) ? 0 : num;
  };

  /* DETECT NUMERIC COLUMNS */
  const numericColumns = rows.length
    ? Object.keys(rows[0]).filter((key) =>
        rows.slice(0, 40).some((r) => !isNaN(cleanNumber(r[key])))
      )
    : [];

  /* PRIMARY METRIC COLUMN */
  const primaryColumn =
    numericColumns.find(
      (c) =>
        c.toLowerCase().includes("unit") ||
        c.toLowerCase().includes("production")
    ) || numericColumns[0];

  const totalRecords = rows.length;

  const totalSum = primaryColumn
    ? rows.reduce(
        (sum, r) => sum + cleanNumber(r[primaryColumn]),
        0
      )
    : 0;

  const averageValue =
    totalRecords > 0 ? totalSum / totalRecords : 0;

  /* PROFIT DETECTION */
  const revenueColumn = numericColumns.find((c) =>
    c.toLowerCase().includes("revenue")
  );

  const costColumn = numericColumns.find((c) =>
    c.toLowerCase().includes("cost")
  );

  const profitColumn = numericColumns.find((c) =>
    c.toLowerCase().includes("profit")
  );

  let totalProfit = 0;

  if (profitColumn) {
    totalProfit = rows.reduce(
      (sum, r) => sum + cleanNumber(r[profitColumn]),
      0
    );
  } else if (revenueColumn && costColumn) {
    totalProfit = rows.reduce(
      (sum, r) =>
        sum +
        (cleanNumber(r[revenueColumn]) -
          cleanNumber(r[costColumn])),
      0
    );
  }

  /* COUNT ANIMATION */
  const useCountUp = (target) => {
    const [value, setValue] = useState(0);

    useEffect(() => {
      let start = 0;
      const duration = 700;
      const stepTime = 20;
      const increment = target / (duration / stepTime);

      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setValue(target);
          clearInterval(timer);
        } else {
          setValue(start);
        }
      }, stepTime);

      return () => clearInterval(timer);
    }, [target]);

    return Math.round(value);
  };

  /* KPI STATS */
  const stats = [
    {
      title: "Total Records",
      value: useCountUp(totalRecords).toLocaleString(),
      icon: <StorageIcon fontSize="small" />,
      accent: "bg-blue-100 text-blue-600",
    },
    {
      title: `Total ${primaryColumn || "Metric"}`,
      value: useCountUp(totalSum).toLocaleString(),
      icon: <PrecisionManufacturingIcon fontSize="small" />,
      accent: "bg-green-100 text-green-600",
    },
    {
      title: `Average ${primaryColumn || "Metric"}`,
      value: useCountUp(averageValue).toLocaleString(),
      icon: <InsightsIcon fontSize="small" />,
      accent: "bg-purple-100 text-purple-600",
    },
    {
      title: "Total Profit",
      value: `₹${useCountUp(totalProfit).toLocaleString()}`,
      icon: <CurrencyRupeeIcon fontSize="small" />,
      accent: "bg-orange-100 text-orange-600",
    },
  ];

  /* EMPTY STATE */
  if (!rows.length) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center text-gray-500">
        Upload a dataset to view KPI statistics.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="
            bg-white rounded-2xl border border-gray-100
            shadow-sm p-6 hover:shadow-md transition-all
          "
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.accent}`}
          >
            {stat.icon}
          </div>

          <p className="text-sm text-gray-500">{stat.title}</p>

          <h2 className="text-2xl font-semibold text-gray-800">
            {stat.value}
          </h2>
        </motion.div>
      ))}
    </div>
  );
}