import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "../backend/src/models/Admin.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📦 Connected to MongoDB");

    const existingAdmin = await Admin.findOne({ email: "admin@ugfamily.com" });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists. Skipping seeding.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin12345!", 10);

    await Admin.create({
      email: "admin@ugfamily.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Admin seeded successfully!");
    console.log("📧 Email: admin@ugfamily.com");
    console.log("🔐 Password: Admin12345!");

    process.exit(0);

  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
