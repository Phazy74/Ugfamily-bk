import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getAccountOverview, getUserInfo} from "../controllers/accountController.js";

const router = express.Router();

// GET /api/account/me
router.get("/me", requireAuth, getAccountOverview);
router.get("/user-info",  requireAuth, getUserInfo);

export default router;
