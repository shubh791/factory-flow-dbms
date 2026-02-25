import { motion } from "framer-motion";

const StatsCard = ({ title, value, accent = "blue" }) => {
  const accentStyles = {
    blue: "from-blue-500/10 to-blue-100 text-blue-600",
    green: "from-green-500/10 to-green-100 text-green-600",
    purple: "from-purple-500/10 to-purple-100 text-purple-600",
    orange: "from-orange-500/10 to-orange-100 text-orange-600",
  };

  const selectedAccent =
    accentStyles[accent] || accentStyles.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35 }}
      className="
        relative
        overflow-hidden
        bg-white
        rounded-2xl
        p-5 sm:p-6
        shadow-sm
        hover:shadow-2xl
        transition-all
        duration-300
        border border-gray-200
        w-full
      "
    >
      {/* Soft top gradient glow */}
      <div
        className={`
          absolute
          inset-0
          opacity-40
          bg-gradient-to-br
          ${selectedAccent}
          pointer-events-none
        `}
      />

      <div className="relative z-10">
        {/* Title */}
        <p className="text-xs sm:text-sm text-gray-500 tracking-wide font-medium">
          {title}
        </p>

        {/* Value */}
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-3 text-gray-900">
          {value}
        </h3>
      </div>
    </motion.div>
  );
};

export default StatsCard;