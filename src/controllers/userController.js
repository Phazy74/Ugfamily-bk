// export const acceptKycTerms = async (req, res) => {
//   try {
//     const userId = req.user.userId;

//     const user = await User.findByIdAndUpdate(
//       userId,
//       { kycTermsAccepted: true },
//       { new: true }
//     );

//     return res.json({
//       message: "Terms accepted. Proceed to verification.",
//       user
//     });

//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };
import User from "../models/User.js";
import Account from "../models/Account.js";

export const acceptKycTerms = async (req, res) => {
  try {
    const userId = req.user.userId;  // this comes from requireAuth

    const user = await User.findByIdAndUpdate(
      userId,
      { kycTermsAccepted: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      message: "Terms accepted. Proceed to verification.",
      user
    });

  } catch (e) {
    console.log("KYC ERROR:", e);
    res.status(500).json({ error: e.message });
  }
};


export const getMeSidebar = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select("personalInfo kyc");
    const account = await Account.findOne({ user: userId }).select("accountNumber");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const fullName = `${user.personalInfo.legalFirstName} ${
      user.personalInfo.middleName || ""
    } ${user.personalInfo.legalLastName}`.trim();

    const initials = fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    return res.json({
      fullName,
      initials,
      accountNumber: account?.accountNumber || null,
      balance: account?.balances?.usd?.available || 0,
      kycCompleted: user.kyc?.status?.approved || false,
    });

  } catch (e) {
    console.log("GET SIDEBAR ERROR:", e);
    return res.status(500).json({ error: e.message });
  }
};

