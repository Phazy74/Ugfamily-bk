import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { formatValidationErrors } from "../utils/formatErrors.js";
import Account from "../models/Account.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {sendEmail} from "../utils/sendEmail.js";
import PendingUser from "../models/PendingUser.js";






export const registerStep1 = async (req, res) => {
  try {
    const { personalInfo, contactDetail, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 12);

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const tempToken = jwt.sign(
      {
        step: "verify-email",
        personalInfo,
        contactDetail,
        passwordHash,
        code,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    const html = `
      <div style="font-family:Arial; padding:25px;">
        <h2>Your UnionGate Verification Code</h2>
        <p>Hello ${personalInfo.legalFirstName}, use the code below:</p>
        <div style="font-size:32px; font-weight:bold; padding:12px; background:#d8e28c; color:#114a43; width:max-content;">
          ${code}
        </div>
      </div>
    `;

    await sendEmail(
      contactDetail.email,
      "Your UnionGate Verification Code",
      html
    );

    res.json({
      message: "Verification code sent",
      tempToken,
    });

  } catch (err) {
    console.error("REGISTER STEP1 ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};


export const verifyEmailStep = async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

    if (decoded.code !== code) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Issue a new token for next step (no code needed)
    const nextToken = jwt.sign(
      {
        step: "account-setup",
        personalInfo: decoded.personalInfo,
        contactDetail: decoded.contactDetail,
        passwordHash: decoded.passwordHash,
      },
      process.env.JWT_SECRET,
      { expiresIn: "20m" }
    );

    res.json({
      message: "Email verified",
      nextToken,
    });

  } catch (e) {
    res.status(400).json({ error: "Verification expired. Restart signup." });
  }
};





// 
export const registerStep3 = async (req, res) => {
  try {
    const { nextToken, accountType, transactionPin } = req.body;

    if (!nextToken) return res.status(400).json({ error: "Missing verification token" });
    if (!transactionPin || transactionPin.length !== 4)
      return res.status(400).json({ error: "PIN must be 4 digits" });

    // Decode previous registration step
    const decoded = jwt.verify(nextToken, process.env.JWT_SECRET);

    // Ensure this token is from step 2
    if (decoded.step !== "account-setup") {
      return res.status(400).json({ error: "Invalid registration flow" });
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(transactionPin, 12);

    // Build final token for last step
    const finalToken = jwt.sign(
      {
        step: "complete-registration",
        personalInfo: decoded.personalInfo,
        contactDetail: decoded.contactDetail,
        passwordHash: decoded.passwordHash,
        accountType,
        pinHash,
      },
      process.env.JWT_SECRET,
      { expiresIn: "20m" }
    );

    res.json({
      message: "Continue to final step",
      finalToken,
    });

  } catch (e) {
    console.log("STEP 3 ERROR:", e);
    return res.status(400).json({ error: "please go back and fill up all the details" });
  }
};


// STEP 2 -------------------------------------------
export const registerStep2 = async (req, res) => {
  try {
    const { userId, accountType, transactionPin } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.security.isEmailVerified)
      return res.status(401).json({ error: "Email not verified" });

    // Hash PIN
    const pinHash = await bcrypt.hash(transactionPin, 12);

    user.accountSetup = {
      accountType,
      transactionPinHash: pinHash,
    };

    await user.save();

    res.json({ message: "Step 2 completed" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const completeRegistration = async (req, res) => {
  try {
    const { finalToken } = req.body;

    const decoded = jwt.verify(finalToken, process.env.JWT_SECRET);

    // CREATE USER
    const user = await User.create({
      personalInfo: decoded.personalInfo,
      contactDetail: decoded.contactDetail,
      accountSetup: {
        accountType: decoded.accountType,
        transactionPinHash: decoded.pinHash,
      },
      security: {
        passwordHash: decoded.passwordHash,
        termsAcceptedAt: new Date(),
      }
    });

    // CREATE ACCOUNT
    const account = await Account.create({
      user: user._id,
      accountNumber: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      accountId: "UG-" + Date.now(),
      balances: {
        usd: { available: 0, ledger: 0 },
        usdt: { available: 0, ledger: 0 },
        btc: { available: 0, ledger: 0 },
      }
    });

    // Issue login token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Account created",
      token,
      userId: user._id
    });

  } catch (e) {
    res.status(400).json({ error: "please go back and fill up all the details" });
  }
};

export const loginStep1 = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ "contactDetail.email": email.toLowerCase() })
      .select("+security.passwordHash +accountSetup.transactionPinHash");

    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.security.passwordHash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    // Create temporary token for PIN step
    const tempToken = jwt.sign(
      { userId: user._id, step: "pin" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" } // 5 minutes only
    );

    return res.json({
      message: "Password OK. Enter your PIN.",
      requiresPin: true,
      tempToken
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};



export const loginStep2 = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "Session expired, login again" });

    const tempToken = authHeader.split(" ")[1];
    if (!tempToken)
      return res.status(401).json({ error: "Session expired, login again" });

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Session expired, login again" });
    }

    // 🔥 Ensure this token is ONLY for PIN verification
    if (decoded.step !== "pin") {
      return res.status(401).json({ error: "Invalid login session" });
    }

    const user = await User.findById(decoded.userId).select(
      "+accountSetup.transactionPinHash"
    );

    if (!user)
      return res.status(404).json({ error: "User not found" });

    const { pin } = req.body;

    const ok = await bcrypt.compare(pin, user.accountSetup.transactionPinHash);
    if (!ok) {
      return res.status(400).json({ error: "Invalid PIN" });
    }

    // Generate REAL login token
    const finalToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token: finalToken
    });

  } catch (err) {
    console.error("LOGIN STEP2 ERROR:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};


export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-security.passwordHash -accountSetup.transactionPinHash");
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const logout = async (_req, res) => {
  // If you're storing tokens client-side, the client can just delete it.
  // If using cookies, you can clear the cookie here.
  res.json({ message: "Logged out" });
};
