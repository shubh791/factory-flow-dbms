import express from "express";
import {
  uploadMiddleware,
  uploadDataset,
} from "../controllers/uploadController.js";

const router = express.Router();

router.post(
  "/upload-dataset",
  uploadMiddleware.single("file"),
  uploadDataset
);

export default router;