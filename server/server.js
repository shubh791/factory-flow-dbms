/*
=========================================================
INDUSTRIAL DBMS - MAIN SERVER FILE
---------------------------------------------------------
- Express server setup
- Middleware configuration
- Static uploads handling
- Modular API route mounting
- Centralized error handling
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

// Enable Cross-Origin Requests (Frontend ↔ Backend)
app.use(cors());

// Parse JSON body
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

/* =====================================================
   STATIC FILES (UPLOADS)
===================================================== */

// Create uploads folder if not exists
const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve uploaded files
app.use("/uploads", express.static(uploadsPath));

/* =====================================================
   ROUTE IMPORTS
===================================================== */

import departmentRoutes from "./routes/departmentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import productionRoutes from "./routes/productionRoutes.js";

import datasetRoutes from "./routes/datasetRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import employeeUploadRoutes from "./routes/employeeUploadRoutes.js";
import productionUploadRoutes from "./routes/productionUploadRoutes.js";

import analyticsRoutes from "./routes/analyticsRoutes.js";
import employeeAnalyticsRoutes from "./routes/employeeAnalyticsRoutes.js";

import aiRoutes from "./routes/aiRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

/* =====================================================
   API ROUTE MOUNTING
===================================================== */

/*
All APIs are prefixed with /api
Example:
GET /api/departments
GET /api/products
GET /api/reports/export-report
*/

app.use("/api/departments", departmentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/production", productionRoutes);

app.use("/api/datasets", datasetRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/employee-upload", employeeUploadRoutes);
app.use("/api/production-upload", productionUploadRoutes);

app.use("/api/analytics", analyticsRoutes);
app.use("/api/employee-analytics", employeeAnalyticsRoutes);

app.use("/api/ai", aiRoutes);

/*
REPORT ROUTES
Final endpoint:
GET http://localhost:5000/api/reports/export-report
*/
app.use("/api/reports", reportRoutes);

/* =====================================================
   HEALTH CHECK ROUTE
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