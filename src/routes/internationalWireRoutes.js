import express from "express";
import {
  verifyInternationalBeneficiary,
  sendInternationalWire
} from "../controllers/internationalWireController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/verify", requireAuth , verifyInternationalBeneficiary);
router.post("/send", requireAuth , sendInternationalWire);

export default router;
