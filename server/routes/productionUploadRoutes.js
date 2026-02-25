import express from "express";
import {
  uploadMiddleware,
  uploadProductionCSV,
} from "../controllers/productionUploadController.js";

const router = express.Router();

router.post(
  "/upload-production-csv",
  uploadMiddleware.single("file"),
  uploadProductionCSV
);

export default router;