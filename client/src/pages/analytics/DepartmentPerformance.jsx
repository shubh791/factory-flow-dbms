import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import API from "../../api/api";
import ReactECharts from "echarts-for-react";

export default function DepartmentPerformance() {
  const [departmentStats, setDepartmentStats] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await API.get("/analytics/department/performance");
      setDepartmentStats(res.data || []);
    } catch (err) {
      console.error("Failed to load department data", err);
    }
  };

  const chartOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["Total Units", "Efficiency %"] },

    xAxis: {
      type: "category",
      data: departmentStats.map((d) => d.department),
    },

    yAxis: [
      { type: "value", name: "Units" },
      { type: "value", name: "Efficiency %", max: 100 },
    ],

    series: [
      {
        name: "Total Units",
        type: "bar",
        data: departmentStats.map((d) => d.units),
      },
      {
        name: "Efficiency %",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: departmentStats.map((d) => d.efficiency),
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-50 min-h-screen p-6 md:p-10 space-y-10"
    >
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">
          Department Performance Intelligence
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Analytics generated directly from relational DB queries.
        </p>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">
          Department Statistics
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Employees</th>
                <th className="p-3 text-left">Avg Experience</th>
                <th className="p-3 text-left">Total Units</th>
                <th className="p-3 text-left">Defects</th>
                <th className="p-3 text-left">Efficiency (%)</th>
              </tr>
            </thead>

            <tbody>
              {departmentStats.map((dept, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{dept.department}</td>
                  <td className="p-3">{dept.employees}</td>
                  <td className="p-3">{dept.avgExperience}</td>
                  <td className="p-3 font-medium">
                    {dept.units.toLocaleString()}
                  </td>
                  <td className="p-3">
                    {dept.defects.toLocaleString()}
                  </td>
                  <td className="p-3 font-semibold text-emerald-600">
                    {dept.efficiency}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white border rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">
          Department Efficiency Analysis
        </h3>
        <ReactECharts option={chartOption} style={{ height: 420 }} />
      </div>
    </motion.div>
  );
}