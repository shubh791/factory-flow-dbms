import express from "express";
import {
  createDepartment,
  getDepartments,
} from "../controllers/departmentController.js";

const router = express.Router();

router.post("/", createDepartment);
router.get("/", getDepartments);

export default router;