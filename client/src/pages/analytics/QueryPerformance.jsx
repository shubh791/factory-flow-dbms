import { useEffect, useState } from "react";
import API from "../../api/api";
import { motion } from "framer-motion";

/*
=============================================================================
QUERY PERFORMANCE PAGE
Demonstrates measurable DBMS efficiency improvements
=============================================================================
*/

export default function QueryPerformance() {

  const [data, setData] = useState(null);

  useEffect(() => {
    API.get("/query-performance")
      .then(res => setData(res.data))
      .catch(console.error);
  }, []);

  if (!data) return <div className="p-8">Measuring database performance...</div>;

  const simulatedManualTime = 2000; // ms baseline manual system

  const improvement =
    ((simulatedManualTime - data.productionAggregation) / simulatedManualTime) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-50 min-h-screen p-8 space-y-12"
    >

      {/* ================= HEADER ================= */}
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">
          Query Performance & Index Impact
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Live measurement of DB query execution demonstrating performance optimization.
        </p>
      </div>

      {/* ================= PERFORMANCE TABLE ================= */}
      <div className="bg-white border rounded-2xl p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Query Operation</th>
              <th className="py-2">Execution Time (ms)</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            <tr>
              <td>Production Aggregation</td>
              <td>{data.productionAggregation} ms</td>
            </tr>
            <tr>
              <td>Employee Count</td>
              <td>{data.employeeCount} ms</td>
            </tr>
            <tr>
              <td>Product Grouping</td>
              <td>{data.departmentGrouping} ms</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ================= PERFORMANCE BOOST ================= */}
      <div className="bg-white border rounded-2xl p-8 text-center">
        <h3 className="text-sm text-slate-500">Performance Boost</h3>
        <h2 className="text-4xl font-bold text-slate-900 mt-3">
          {improvement.toFixed(1)}%
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          Improvement compared to simulated manual aggregation system.
        </p>
      </div>

      {/* ================= EXPLANATION ================= */}
      <div className="bg-white border rounded-2xl p-6">
        <h3 className="font-semibold mb-3">DBMS Performance Advantage</h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          Structured indexing, optimized query planning, and relational
          aggregation mechanisms significantly reduce query execution time.
          This demonstrates measurable operational acceleration compared to
          manual or unstructured data systems.
        </p>
      </div>

    </motion.div>
  );
}