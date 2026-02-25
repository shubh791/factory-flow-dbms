import { useEffect, useState } from "react";
import API from "../api/api";
import { motion } from "framer-motion";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PsychologyIcon from "@mui/icons-material/Psychology";

/*
==================================================
AI INDUSTRIAL ANALYZER
- Central API usage
- Premium SaaS UI
- Responsive
- Animated loading skeleton
- Styled AI insights
==================================================
*/

export default function AIAnalyser() {
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= FETCH AI INSIGHTS ================= */
  useEffect(() => {
    API.get("/ai/ai-analysis")
      .then(res => {
        setInsights(res.data.insights);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load AI insights");
        setLoading(false);
      });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 lg:p-10 max-w-6xl mx-auto space-y-8"
    >
      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-3">
        <PsychologyIcon className="text-blue-600" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          AI Industrial Analyzer
        </h1>
      </div>

      {/* ================= AI CARD ================= */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-white rounded-2xl shadow border p-6 md:p-8 space-y-6"
      >
        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-500">{error}</p>
        )}

        {/* AI Insights */}
        {!loading && !error && (
          <>
            <div className="flex items-center gap-2 text-blue-600 font-semibold">
              <AutoAwesomeIcon fontSize="small" />
              AI Generated Insights
            </div>

            <div className="bg-slate-50 border rounded-xl p-5 text-gray-700 leading-relaxed whitespace-pre-wrap">
              {insights}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}