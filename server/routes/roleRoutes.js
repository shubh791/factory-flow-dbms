import express from "express";
import {
  getRoles,
  createRole,
  deleteRole
} from "../controllers/roleController.js";

const router = express.Router();

router.get("/", getRoles);
router.post("/", createRole);
router.delete("/:id", deleteRole);

export default router;