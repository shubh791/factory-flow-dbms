import { useEffect, useState, useMemo } from "react";
import API from "../../api/api";
import { motion } from "framer-motion";

/*
==================================================
AUDIT LOGS – ENTERPRISE MONITORING DASHBOARD
==================================================
*/

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await API.get("/audit-logs");
      setLogs(res.data || []);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    }
  };

  /* ================= KPI SUMMARY ================= */

  const today = new Date().toDateString();

  const todayLogs = useMemo(
    () =>
      logs.filter(
        (log) =>
          new Date(log.timestamp).toDateString() === today
      ),
    [logs]
  );

  const criticalLogs = useMemo(
    () =>
      logs.filter((log) =>
        ["DELETE", "PROMOTION"].includes(log.action)
      ),
    [logs]
  );

  const getActionColor = (action) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-700";
      case "UPDATE":
        return "bg-blue-100 text-blue-700";
      case "DELETE":
        return "bg-red-100 text-red-700";
      case "PROMOTION":
        return "bg-indigo-100 text-indigo-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen p-10 space-y-12"
    >
      {/* ================= HEADER ================= */}
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">
          System Audit Logs
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Centralized monitoring of all critical database operations.
        </p>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid md:grid-cols-3 gap-6">

        <KpiCard
          title="Total Logs"
          value={logs.length}
        />

        <KpiCard
          title="Today's Activity"
          value={todayLogs.length}
        />

        <KpiCard
          title="Critical Actions"
          value={criticalLogs.length}
        />
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-3xl border shadow-sm p-8">
        <h3 className="font-semibold mb-6">
          Activity Timeline
        </h3>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Entity</th>
                <th className="p-3 text-left">Entity ID</th>
                <th className="p-3 text-left">Performed By</th>
                <th className="p-3 text-left">Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-t hover:bg-slate-50 transition"
                >
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="p-3 font-medium text-slate-900">
                    {log.entity}
                  </td>

                  <td className="p-3 text-slate-600">
                    #{log.entityId}
                  </td>

                  <td className="p-3 text-slate-600">
                    {log.performedBy || "System"}
                  </td>

                  <td className="p-3 text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center p-10 text-slate-500"
                  >
                    No audit logs available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

/* ================= KPI CARD COMPONENT ================= */

const KpiCard = ({ title, value }) => (
  <div className="bg-white p-6 rounded-3xl border shadow-sm">
    <p className="text-sm text-slate-600">{title}</p>
    <h3 className="text-3xl font-semibold text-slate-900 mt-2">
      {value}
    </h3>
  </div>
);