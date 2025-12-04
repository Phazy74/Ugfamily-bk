// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { connectDB } from "./config/db.js";

// dotenv.config();
// connectDB();

// const app = express();

// app.use(cors());
// app.use(express.json());

// // TEST ROUTE
// app.get("/", (req, res) => {
//   res.send("Backend is running...");
// });

// export default app;


import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/Users.js"

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/auth", authLimiter, authRoutes);

app.get("/", (_req, res) => res.send("Backend is running..."));

import kycRoutes from "./routes/kyc.js";
app.use("/api/kyc", kycRoutes);

import accountRoutes from "./routes/accountRoutes.js";
app.use("/api/account", accountRoutes);

import virtualCardRoutes from "./routes/virtualCardRoutes.js";
app.use("/api/virtual-cards", virtualCardRoutes);

import transferRoutes from "./routes/transferRoutes.js";
app.use("/api/transfer", transferRoutes);

import internationalWireRoutes from "./routes/internationalWireRoutes.js";
app.use("/api/wire", internationalWireRoutes);





app.use("/api/user", userRoutes);


export default app;

