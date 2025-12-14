import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// router.post(
//   "/upload-profile",
//   requireAuth,
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       if (!req.file) {
//         return res.status(400).json({ success: false, message: "No file uploaded" });
//       }

//       // Upload to Cloudinary
//       const uploaded = await cloudinary.uploader.upload_stream(
//         { folder: "banking/profile_pictures" },
//         (error, result) => {
//           if (error) return res.status(500).json({ success: false, message: "Upload failed" });

//           User.findByIdAndUpdate(
//             req.user.userId,
//             { profileImage: result.secure_url },
//             { new: true }
//           )
//             .select("profileImage")
//             .then((updatedUser) => {
//               return res.json({
//                 success: true,
//                 message: "Profile image updated",
//                 profileImage: updatedUser.profileImage,
//               });
//             });
//         }
//       );

//       uploaded.end(req.file.buffer);
//     } catch (e) {
//       console.error("UPLOAD ERROR:", e);
//       return res.status(500).json({ success: false, message: e.message });
//     }
//   }
// );
router.post(
  "/upload-profile",
  requireAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // 🔑 Wrap upload_stream in a Promise
      const uploadToCloudinary = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "banking/profile_pictures" },
            (error, result) => {
              if (error) {
                console.error("CLOUDINARY ERROR:", error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          stream.end(req.file.buffer);
        });

      // ⬇️ Now await works correctly
      const result = await uploadToCloudinary();

      const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        { profileImage: result.secure_url },
        { new: true }
      ).select("profileImage");

      return res.json({
        success: true,
        message: "Profile image updated",
        profileImage: updatedUser.profileImage,
      });

    } catch (e) {
      console.error("UPLOAD PROFILE ERROR:", e);
      return res.status(500).json({
        success: false,
        message: e.message || "Image upload failed",
      });
    }
  }
);


export default router;
