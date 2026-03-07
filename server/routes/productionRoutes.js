import express from "express";
import {
  createProduction,
  getProduction,
  deleteProduction,
  updateProduction,
  clearProduction,
} from "../controllers/productionController.js";

const router = express.Router();

router.post("/", createProduction);
router.get("/", getProduction);

router.delete("/clear", clearProduction);  // 🔥 NEW ROUTE
router.delete("/:id", deleteProduction);

router.patch("/:id", updateProduction);

export default router;