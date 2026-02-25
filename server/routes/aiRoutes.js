import express from "express";
import {
  analyseDataset,
} from "../controllers/aiController.js";

const router = express.Router();

router.get("/ai-analysis", analyseDataset);

export default router;