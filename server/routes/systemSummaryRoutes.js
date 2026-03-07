import express from "express";
import { generateSystemSummary } from "../controllers/systemSummaryController.js";

const router = express.Router();

router.get("/", generateSystemSummary);

export default router;