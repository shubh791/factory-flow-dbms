import express from "express";
import {
  getDatasets,
  getDatasetById,
  getLatestDataset,
  getDatasetAnalytics,
} from "../controllers/datasetController.js";

const router = express.Router();

router.get("/", getDatasets);
router.get("/latest", getLatestDataset);
router.get("/analytics", getDatasetAnalytics);
router.get("/:id", getDatasetById);

export default router;