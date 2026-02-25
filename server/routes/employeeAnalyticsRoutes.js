import express from "express";
import {
  getEmployeeAnalytics,
} from "../controllers/employeeAnalyticsController.js";

const router = express.Router();

router.get("/", getEmployeeAnalytics);

export default router;