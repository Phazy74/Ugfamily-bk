import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// 1. THIS IS THE NEW ROUTE WE ADDED TO FETCH THE USER'S NAME
router.get("/profile", requireAuth, async (req, res) => {
  try {
    // req.user.userId comes from your requireAuth middleware
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// 2. THIS IS YOUR EXISTING UPLOAD ROUTE
router.post(
  "/upload-profile",
  requireAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      // Upload to Cloudinary
      const uploaded = await cloudinary.uploader.upload_stream(
        { folder: "banking/profile_pictures" },
        (error, result) => {
          if (error) return res.status(500).json({ success: false, message: "Upload failed" });

          User.findByIdAndUpdate(
            req.user.userId,
            { profileImage: result.secure_url },
            { new: true }
          )
            .select("profileImage")
            .then((updatedUser) => {
              return res.json({
                success: true,
                message: "Profile image updated",
                profileImage: updatedUser.profileImage,
              });
            });
        }
      );

      uploaded.end(req.file.buffer);
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
);

export default router;