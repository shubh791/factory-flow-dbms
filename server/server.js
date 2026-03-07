/*
=========================================================
INDUSTRIAL DBMS - MAIN SERVER FILE
=========================================================
*/

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* =====================================================
   FIX __dirname FOR ES MODULES
===================================================== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =====================================================
   INITIALIZE EXPRESS APP
===================================================== */

const app = express();

/* =====================================================
   GLOBAL MIDDLEWARE
===================================================== */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =====================================================
   STATIC FILES (UPLOADS)
===================================================== */

const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use("/uploads", express.static(uploadsPath));

/* =====================================================
   ROUTE IMPORTS
===================================================== */

import departmentRoutes from "./routes/departmentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import productionRoutes from "./routes/productionRoutes.js";

import datasetRoutes from "./routes/datasetRoutes.js";

import employeeUploadRoutes from "./routes/employeeUploadRoutes.js";
import productionUploadRoutes from "./routes/productionUploadRoutes.js";

import analyticsRoutes from "./routes/analyticsRoutes.js";
import employeeAnalyticsRoutes from "./routes/employeeAnalyticsRoutes.js";

import aiRoutes from "./routes/aiRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import systemSummaryRoutes from "./routes/systemSummaryRoutes.js";
import dataIntegrityRoutes from "./routes/dataIntegrityRoutes.js";
import queryPerformanceRoutes from "./routes/queryPerformanceRoutes.js";

/* =====================================================
   API ROUTE MOUNTING
===================================================== */

app.use("/api/departments", departmentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/production", productionRoutes);

app.use("/api/datasets", datasetRoutes);
app.use("/api/employee-upload", employeeUploadRoutes);
app.use("/api/production-upload", productionUploadRoutes);

app.use("/api/analytics", analyticsRoutes);
app.use("/api/employee-analytics", employeeAnalyticsRoutes);

app.use("/api/ai", aiRoutes);

/* ✅ FIXED HERE */
app.use("/api/promotions", promotionRoutes);

app.use("/api/audit-logs", auditRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/system-summary", systemSummaryRoutes);
app.use("/api/data-integrity", dataIntegrityRoutes);
app.use("/api/query-performance", queryPerformanceRoutes);

app.use("/api/reports", reportRoutes);

/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/", (req, res) => {
  res.send("🚀 Industrial DBMS API Running");
});

/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);

  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

/* =====================================================
   START SERVER
===================================================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});