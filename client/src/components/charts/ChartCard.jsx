import { motion } from "framer-motion";

export default function ChartCard({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="
        rounded-2xl
        p-6
        bg-gradient-to-br
        from-slate-900
        to-slate-950
        border border-slate-700/60
        shadow-xl
        backdrop-blur-sm
      "
    >
      <h3 className="text-slate-100 text-sm uppercase tracking-wider font-semibold mb-6">
        {title}
      </h3>

      <div className="text-slate-300">
        {children}
      </div>
    </motion.div>
  );
}