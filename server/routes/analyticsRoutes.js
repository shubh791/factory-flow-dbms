import express from "express";
import {
  getAnalyticsSummary,
  getProductionInsights,
  getDepartmentPerformance
} from "../controllers/analyticsController.js";

const router = express.Router();

/* Executive KPI Summary */
router.get("/executive-summary", getAnalyticsSummary);

/* Production Insights */
router.get("/production/insights", getProductionInsights);

/* Department Performance */
router.get("/department/performance", getDepartmentPerformance);

export default router;