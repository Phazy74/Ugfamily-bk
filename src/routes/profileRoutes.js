import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import uploadAvatar from "../middleware/uplaodAvatar.js";

import {
  updateAvatar,
  changePassword,
  changePin,
  updateProfile
} from "../controllers/settingsController.js";

const router = express.Router();
router.post("/update-profile", requireAuth, updateProfile);

router.post("/avatar", requireAuth , uploadAvatar.single("avatar"), updateAvatar);
router.post("/change-password", requireAuth , changePassword);
router.post("/change-pin", requireAuth , changePin);

export default router;
