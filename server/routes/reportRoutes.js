import express from "express";
import { exportReport } from "../controllers/reportController.js";

const router = express.Router();

router.get("/export-report", exportReport);

export default router;