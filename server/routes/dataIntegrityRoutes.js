import express from "express";
import { getIntegrityStatus } from "../controllers/dataIntegrityController.js";

const router = express.Router();

router.get("/", getIntegrityStatus);

export default router;