import express from "express";
import { generateReport } from "../controllers/reportController.js";

const router = express.Router();

/* PDF Export Route */
router.get("/export-report", generateReport);

export default router;