import express from "express";
import {
  createEmployee,
  getEmployees,
  deleteEmployee,
  updateEmployee,
  clearEmployees,
} from "../controllers/employeeController.js";

const router = express.Router();

router.post("/", createEmployee);
router.get("/", getEmployees);

router.delete("/clear", clearEmployees);   // 🔥 NEW ROUTE
router.delete("/:id", deleteEmployee);

router.patch("/:id", updateEmployee);

export default router;