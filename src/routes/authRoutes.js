import express from "express";
import { register, login, me, logout } from "../controllers/authController.js";
import { registerRules, loginRules } from "../validation/authValidation.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerRules, register);
router.post("/login",    loginRules,    login);
router.get("/me",        requireAuth,   me);
router.post("/logout",   requireAuth,   logout);

export default router;
