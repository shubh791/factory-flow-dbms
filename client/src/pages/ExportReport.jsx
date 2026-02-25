import { useState } from "react";
import { motion } from "framer-motion";
import API from "../api/api";

import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

/*
====================================================
EXPORT REPORT PAGE
- Correct API integration
- Blob PDF download (best practice)
- Premium SaaS UI
- Responsive
- Animation included
- Error handling
====================================================
*/

export default function ExportReport() {
  const [downloading, setDownloading] = useState(false);

  /* ================= DOWNLOAD HANDLER ================= */

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const response = await API.get(
        "/reports/export-report",
        {
          responseType: "blob",
        }
      );

      /* Create downloadable file */
      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "Industrial_Report.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setDownloading(false);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download report.");
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 lg:p-10 max-w-6xl mx-auto"
    >
      <div className="bg-white border shadow-xl rounded-3xl p-8 md:p-12 space-y-10">

        {/* ================= HEADER ================= */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <DescriptionIcon fontSize="large" />
            </div>
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-gray-800">
            AI Industrial Executive Report
          </h1>

          <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base">
            Generate a professional AI-powered industrial report
            based on your latest operational dataset.
          </p>
        </div>

        {/* ================= REPORT DETAILS ================= */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-slate-50 rounded-2xl p-6 border"
        >
          <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
            <PictureAsPdfIcon fontSize="small" />
            Report Includes
          </div>

          <ul className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
            <li>✔ Production KPIs Summary</li>
            <li>✔ Efficiency & Defect Metrics</li>
            <li>✔ Product Breakdown Analysis</li>
            <li>✔ AI Executive Insights</li>
            <li>✔ Operational Risk Detection</li>
            <li>✔ Strategic Recommendations</li>
          </ul>
        </motion.div>

        {/* ================= DOWNLOAD BUTTON ================= */}
        <div className="text-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="
              inline-flex items-center gap-3
              bg-blue-600 hover:bg-blue-700
              text-white px-8 py-4
              rounded-2xl font-semibold
              shadow-lg hover:shadow-xl
              transition-all duration-300
            "
          >
            {downloading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Report...
              </div>
            ) : (
              <>
                <DownloadIcon />
                Download Executive PDF
              </>
            )}
          </motion.button>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="text-center text-xs text-gray-400 pt-6 border-t">
          Powered by Industrial AI Analytics Engine
        </div>

      </div>
    </motion.div>
  );
}