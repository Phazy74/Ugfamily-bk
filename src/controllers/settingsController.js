import bcrypt from "bcryptjs";
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";

/* ---------------------------
   Utilities
----------------------------*/
const strongPassword = (pwd = "") =>
  typeof pwd === "string" &&
  pwd.length >= 8 &&
  /[A-Z]/.test(pwd) &&
  /[a-z]/.test(pwd) &&
  /\d/.test(pwd);

const isFourDigits = (s = "") => /^\d{4}$/.test(s);

/* -----------------------------------------
   Change Password
   Body: { currentPassword, newPassword }
------------------------------------------*/
// export const changePassword = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const { currentPassword, newPassword } = req.body || {};

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ error: "Both currentPassword and newPassword are required." });
//     }

//     if (!strongPassword(newPassword)) {
//       return res.status(400).json({
//         error:
//           "Password must be at least 8 chars and include upper, lower, and number."
//       });
//     }

//     const user = await User.findById(userId).select("security.passwordHash");
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const ok = await bcrypt.compare(currentPassword, user.security.passwordHash);
//     if (!ok) return res.status(400).json({ error: "Incorrect current password." });

//     const same = await bcrypt.compare(newPassword, user.security.passwordHash);
//     if (same) return res.status(400).json({ error: "New password must be different from old password." });

//     user.security.passwordHash = await bcrypt.hash(newPassword, 12);
//     await user.save();

//     return res.json({ message: "Password updated successfully." });
//   } catch (e) {
//     console.error("CHANGE PASSWORD ERROR:", e);
//     return res.status(500).json({ error: "Something went wrong." });
//   }
// };
// export const changePassword = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const { oldPassword, newPassword } = req.body;

//     const user = await User.findById(userId);

//     const valid = await bcrypt.compare(oldPassword, user.passwordHash);
//     if (!valid) return res.status(400).json({ error: "Old password incorrect" });

//     user.passwordHash = await bcrypt.hash(newPassword, 12);
//     await user.save();

//     res.json({ message: "Password updated successfully" });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    const match = await bcrypt.compare(currentPassword, user.security.passwordHash);
    if (!match) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    user.security.passwordHash = hash;
    await user.save();

    return res.json({ message: "Password successfully updated" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
/* -----------------------------------------
   Change Transaction PIN (4 digits)
   Body: { currentPin, newPin }
------------------------------------------*/
// export const changePin = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const { currentPin, newPin } = req.body || {};

//     if (!currentPin || !newPin) {
//       return res.status(400).json({ error: "Both currentPin and newPin are required." });
//     }

//     if (!isFourDigits(newPin)) {
//       return res.status(400).json({ error: "PIN must be 4 digits (0-9)." });
//     }

//     const user = await User.findById(userId).select("accountSetup.transactionPinHash");
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const ok = await bcrypt.compare(String(currentPin), user.accountSetup.transactionPinHash);
//     if (!ok) return res.status(400).json({ error: "Incorrect current PIN." });

//     const same = await bcrypt.compare(String(newPin), user.accountSetup.transactionPinHash);
//     if (same) return res.status(400).json({ error: "New PIN must be different from old PIN." });

//     user.accountSetup.transactionPinHash = await bcrypt.hash(String(newPin), 12);
//     await user.save();

//     return res.json({ message: "Transaction PIN updated successfully." });
//   } catch (e) {
//     console.error("CHANGE PIN ERROR:", e);
//     return res.status(500).json({ error: "Something went wrong." });
//   }
// };
// export const changePin = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const { oldPin, newPin } = req.body;

//     const user = await User.findById(userId);

//     const valid = await bcrypt.compare(oldPin, user.accountSetup.transactionPinHash);
//     if (!valid)
//       return res.status(400).json({ error: "Old transaction PIN is incorrect" });

//     user.accountSetup.transactionPinHash = await bcrypt.hash(newPin, 12);
//     await user.save();

//     res.json({ message: "Transaction PIN updated successfully" });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };
export const changePin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPin, newPin } = req.body;

    const user = await User.findById(userId);

    const match = await bcrypt.compare(currentPin, user.accountSetup.transactionPinHash);
    if (!match)
      return res.status(400).json({ error: "Incorrect current PIN" });

    const newHash = await bcrypt.hash(newPin, 12);
    user.accountSetup.transactionPinHash = newHash;
    await user.save();

    return res.json({ message: "Transaction PIN updated" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

/* -----------------------------------------
   Upload Avatar (profile image)
   - multer writes file
   - store URL on user
------------------------------------------*/
// export const uploadAvatar = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: "No file uploaded." });

//     const userId = req.user.userId;
//     const user = await User.findById(userId).select("avatarUrl avatarKey");
//     if (!user) return res.status(404).json({ error: "User not found" });

//     // If user had previous avatar, remove the old file
//     if (user.avatarKey) {
//       const oldPath = path.join(process.cwd(), "uploads", "avatars", user.avatarKey);
//       fs.promises
//         .unlink(oldPath)
//         .catch(() => {}); // ignore if not found
//     }

//     // Save new info
//     user.avatarKey = req.file.filename; // server filename
//     user.avatarUrl = `/uploads/avatars/${req.file.filename}`; // public URL
//     await user.save();

//     return res.json({
//       message: "Avatar updated.",
//       avatarUrl: user.avatarUrl
//     });
//   } catch (e) {
//     console.error("UPLOAD AVATAR ERROR:", e);
//     return res.status(500).json({ error: "Something went wrong." });
//   }
// };
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    // Upload buffer to Cloudinary
    const upload = await cloudinary.uploader.upload_stream(
      { folder: "bank-app/avatars" },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ error: "Cloudinary upload failed" });
        }

        const updated = await User.findByIdAndUpdate(
          userId,
          { "personalInfo.avatar": result.secure_url },
          { new: true }
        );

        res.json({
          message: "Avatar updated",
          avatar: result.secure_url,
        });
      }
    );

    upload.end(req.file.buffer);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, middleName, lastName, phone, country } = req.body;

    const user = await User.findById(userId);

    user.personalInfo.legalFirstName = firstName;
    user.personalInfo.middleName = middleName;
    user.personalInfo.legalLastName = lastName;
    user.contactDetail.phone = phone;
    user.contactDetail.country = country;

    await user.save();

    return res.json({ message: "Profile updated" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
