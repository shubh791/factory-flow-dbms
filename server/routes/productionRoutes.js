import express from "express";
import {
  createProduction,
  getProduction,
  deleteProduction,
  updateProduction,
} from "../controllers/productionController.js";

const router = express.Router();

router.post("/", createProduction);
router.get("/", getProduction);
router.delete("/:id", deleteProduction);
router.patch("/:id", updateProduction);

export default router;