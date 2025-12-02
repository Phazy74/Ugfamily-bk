import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { formatValidationErrors } from "../utils/formatErrors.js";

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const friendly = formatValidationErrors(errors.array());
    return res.status(400).json({ errors: friendly });
  }
  if (!errors.isEmpty()) {
    console.log("VALIDATION ERRORS:", errors.array());
    return res.status(400).json({ errors: errors.array() });
}
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
console.log("REGISTER BODY:", req.body);

  const {
    personalInfo, contactDetail,
    accountSetup, security
  } = req.body;

  try {
    // uniqueness checks
    const existingEmail = await User.findOne({ "contactDetail.email": contactDetail?.email });
    if (existingEmail) return res.status(400).json({ error: "Email already in use" });

    const existingPhone = await User.findOne({ "contactDetail.phone": contactDetail?.phone });
    if (existingPhone) return res.status(400).json({ error: "Phone already in use" });

    const existingUsername = await User.findOne({ "personalInfo.username": personalInfo.username.toLowerCase() });
    if (existingUsername) return res.status(400).json({ error: "Username already in use" });

    // hash password & 4-digit transaction PIN
    const passwordHash = await bcrypt.hash(security.password, 12);
    const pinHash = await bcrypt.hash(accountSetup.transactionPin, 12);

    const user = await User.create({
      personalInfo: {
        legalFirstName: personalInfo.legalFirstName,
        middleName: personalInfo.middleName,
        legalLastName: personalInfo.legalLastName,
        username: personalInfo.username.toLowerCase()
      },
      contactDetail: {
        email: contactDetail.email?.toLowerCase(),
        phone: contactDetail.phone,
        country: contactDetail.country
      },
      accountSetup: {
        accountType: accountSetup.accountType,
        transactionPinHash: pinHash
      },
      security: {
        passwordHash,
        termsAcceptedAt: new Date()
      }
    });

    const token = generateToken({ userId: user._id });
    res.status(201).json({
      message: "Account created (pre-KYC).",
      token,
      user: {
        id: user._id,
        username: user.personalInfo.username,
        email: user.contactDetail.email,
        accountType: user.accountSetup.accountType
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
// export const register = async (req, res) => {
//   console.log("STEP 1: Entered register controller");

//   const errors = validationResult(req);
//   console.log("STEP 2: Validation errors:", errors.array());

//   if (!errors.isEmpty()) {
//     console.log("❌ VALIDATION FAILED — stopping request");
//     return res.status(400).json({ errors: errors.array() });
//   }

//   console.log("STEP 3: Body after validation:", JSON.stringify(req.body, null, 2));

//   const { personalInfo, contactDetail, accountSetup, security } = req.body;

//   console.log("STEP 4: Extracted fields:");
//   console.log("personalInfo:", personalInfo);
//   console.log("contactDetail:", contactDetail);
//   console.log("accountSetup:", accountSetup);
//   console.log("security:", security);

//   try {
//     console.log("STEP 5: Checking email uniqueness:", contactDetail?.email);

//     const existingEmail = await User.findOne({ "contactDetail.email": contactDetail?.email });
//     console.log("Existing email lookup:", existingEmail);

//     console.log("STEP 6: Hashing password & pin");
//     const passwordHash = await bcrypt.hash(security.password, 12);
//     const pinHash = await bcrypt.hash(accountSetup.transactionPin, 12);

//     console.log("STEP 7: Creating user…");
//     const user = await User.create({
//       personalInfo: {
//         legalFirstName: personalInfo.legalFirstName,
//         middleName: personalInfo.middleName,
//         legalLastName: personalInfo.legalLastName,
//         username: personalInfo.username.toLowerCase()
//       },
//       contactDetail: {
//         email: contactDetail.email?.toLowerCase(),
//         phone: contactDetail.phone,
//         country: contactDetail.country
//       },
//       accountSetup: {
//         accountType: accountSetup.accountType,
//         transactionPinHash: pinHash
//       },
//       security: {
//         passwordHash,
//         termsAcceptedAt: new Date()
//       }
//     });

//     console.log("STEP 8: User created:", user._id);

//     const token = generateToken({ userId: user._id });

//     console.log("STEP 9: Sending response");
//     res.status(201).json({
//       message: "Account created (pre-KYC).",
//       token,
//       user: {
//         id: user._id,
//         username: user.personalInfo.username,
//         email: user.contactDetail.email,
//         accountType: user.accountSetup.accountType
//       }
//     });

//   } catch (e) {
//     console.log("🔥 STEP 10: ERROR IN TRY BLOCK:", e);
//     res.status(500).json({ error: e.message });
//   }
// };

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ "contactDetail.email": email.toLowerCase() });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.security.passwordHash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken({ userId: user._id });
    res.json({
      token,
      user: {
        id: user._id,
        username: user.personalInfo.username,
        email: user.contactDetail.email,
        accountType: user.accountSetup.accountType
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
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
