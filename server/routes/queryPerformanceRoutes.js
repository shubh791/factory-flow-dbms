import express from "express";
import { getQueryPerformance } from "../controllers/queryPerformanceController.js";

const router = express.Router();

router.get("/", getQueryPerformance);

export default router;