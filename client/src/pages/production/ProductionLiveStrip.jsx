import { motion } from "framer-motion";

export default function ProductionLiveStrip({ insights }) {
  if (!insights) return null;

  const {
    totalUnits,
    totalDefects,
    efficiency,
    forecast
  } = insights;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

      {[
        {
          label: "Live Throughput",
          value: totalUnits?.toLocaleString() || 0,
          color: "text-emerald-600"
        },
        {
          label: "Defect Velocity",
          value: totalDefects?.toLocaleString() || 0,
          color: "text-red-600"
        },
        {
          label: "Operational Stability",
          value: `${efficiency || 0}%`,
          color: "text-blue-600"
        },
        {
          label: "Forecast Output",
          value: forecast?.toLocaleString() || "—",
          color: "text-purple-600"
        }
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            bg-white
            border border-slate-200
            rounded-xl
            p-5
            shadow-sm
            hover:shadow-md
            transition
          "
        >
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {item.label}
          </p>
          <h3 className={`text-2xl font-semibold mt-1 ${item.color}`}>
            {item.value}
          </h3>
        </motion.div>
      ))}

    </div>
  );
}