import { motion } from "framer-motion";

/*
=========================================================
KPI STAT CARD – Industrial Executive Style
Clean | Structured | Enterprise Tone
=========================================================
*/

export default function KPIStatCard({
  title,
  value,
  icon,
  accent,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="
        bg-white
        rounded-2xl
        border border-slate-200
        shadow-sm
        hover:shadow-lg
        transition-all
        p-6
        flex flex-col justify-between
        min-h-[140px]
      "
    >
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div
          className={`
            w-11 h-11
            rounded-xl
            flex items-center justify-center
            ${accent}
          `}
        >
          {icon}
        </div>

        <span className="text-[10px] uppercase tracking-wider text-slate-400">
          Industrial Metric
        </span>
      </div>

      {/* Bottom Section */}
      <div className="mt-6">
        <p className="text-xs text-slate-500 font-medium mb-1">
          {title}
        </p>

        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
          {value}
        </h2>
      </div>
    </motion.div>
  );
}