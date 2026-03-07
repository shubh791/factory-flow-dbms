import { useEffect, useState } from "react";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import GroupsIcon from "@mui/icons-material/Groups";

import useCountUp from "../../hooks/useCountUp";
import KPIStatCard from "../ui/KPIStatCard";
import api from "../../api/api";

export default function KPIStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/executive-summary")
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Safe defaults
  const totalUnits = data?.totalUnits ?? 0;
  const totalDefects = data?.totalDefects ?? 0;
  const efficiency = data?.efficiency ?? 0;
  const revenue = data?.revenue ?? 0;

  // Hooks always at top
  const animatedUnits = useCountUp(totalUnits);
  const animatedDefects = useCountUp(totalDefects);
  const animatedRevenue = useCountUp(revenue);

  const defectRate =
    totalUnits > 0
      ? ((totalDefects / totalUnits) * 100).toFixed(2)
      : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-slate-200">
        Loading KPI metrics...
      </div>
    );
  }

  const stats = [
    {
      title: "Total Units Produced",
      value: animatedUnits.toLocaleString(),
      icon: <PrecisionManufacturingIcon fontSize="small" />,
      accent: "bg-green-100 text-green-700",
    },
    {
      title: "Total Defective Units",
      value: animatedDefects.toLocaleString(),
      icon: <ReportProblemIcon fontSize="small" />,
      accent: "bg-red-100 text-red-700",
    },
    {
      title: "Production Efficiency (%)",
      value: `${Number(efficiency).toFixed(2)}%`,
      icon: <TrendingUpIcon fontSize="small" />,
      accent: "bg-indigo-100 text-indigo-700",
    },
    {
      title: "Total Revenue Impact",
      value: `₹${animatedRevenue.toLocaleString()}`,
      icon: <AttachMoneyIcon fontSize="small" />,
      accent: "bg-blue-100 text-blue-700",
    },
    {
      title: "Defect Rate (%)",
      value: `${defectRate}%`,
      icon: <GroupsIcon fontSize="small" />,
      accent: "bg-orange-100 text-orange-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {stats.map((stat, i) => (
        <KPIStatCard key={i} {...stat} />
      ))}
    </div>
  );
}