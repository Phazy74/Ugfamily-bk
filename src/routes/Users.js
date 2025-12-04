import express from "express";
import { acceptKycTerms ,getMeSidebar} from "../controllers/userController.js";
import { requireAuth} from "../middleware/authMiddleware.js";

const router = express.Router();

router.patch("/accept-kyc-terms", requireAuth, acceptKycTerms);
router.get("/me",requireAuth, getMeSidebar);

export default router;
