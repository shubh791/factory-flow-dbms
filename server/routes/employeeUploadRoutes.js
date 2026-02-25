import express from "express";
import {
  uploadMiddleware,
  uploadEmployeesCSV,
} from "../controllers/employeeUploadController.js";

const router = express.Router();

router.post(
  "/upload-employees",
  uploadMiddleware.single("file"),
  uploadEmployeesCSV
);

export default router;