import User from "../models/User.js";
import Account from "../models/Account.js";
import dayjs from "dayjs";

export const getAccountOverview = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch user basic info
    const user = await User.findById(userId).select(
      "personalInfo contactDetail createdAt"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch account info
    let account = await Account.findOne({ user: userId });

    // If account does not exist yet, create default one
    if (!account) {
      account = await Account.create({
        user: userId,
        balances: {
          usd: { available: 0, ledger: 0 },
          usdt: { available: 0, ledger: 0 },
          btc: { available: 0, ledger: 0 },
        },
        limits: {
          dailyTransferLimit: 5000,
          monthlyTransferLimit: 500000,
          dailyWithdrawLimit: 3000,
        },
      });
    }

    // Format numbers
    const formatMoney = num =>
      Number(num || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    // Account age calculation
    const accountAgeDays = dayjs().diff(dayjs(user.createdAt), "day");
    const accountAgeText =
      accountAgeDays < 7
        ? `${accountAgeDays} days`
        : `${Math.floor(accountAgeDays / 7)} weeks`;

    return res.json({
      user: {
  id: user._id,
  personalInfo: {
    legalFirstName: user.personalInfo.legalFirstName,
    middleName: user.personalInfo.middleName,
    legalLastName: user.personalInfo.legalLastName,
  },
  email: user.contactDetail.email,
  phone: user.contactDetail.phone,
},
      account: {
        accountNumber: account.accountNumber,
        currency: account.currency,

        balances: {
          usd: {
            available: account.balances.usd.available,
          },
          usdt: {
            available: account.balances.usdt.available,
          },
          btc: {
            available: account.balances.btc.available,
          },
        },

        analytics: {
          monthlyIncome: account.analytics.monthlyIncome,
          monthlySpending: account.analytics.monthlySpending,
        },

        limits: account.limits,

        accountAge: accountAgeText,
        createdAt: account.createdAt,
      },
    });
  } catch (e) {
    console.error("ACCOUNT ME ERROR:", e);
    return res.status(500).json({ error: e.message });
  }
};
export const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select(
      "personalInfo contactDetail kyc accountSetup"
    );

    const account = await Account.findOne({ user: userId });

    if (!user || !account) {
      return res.status(404).json({ error: "User not found" });
    }

    const fullName =
      `${user.personalInfo.legalFirstName} ${user.personalInfo.middleName} ${user.personalInfo.legalLastName}`.trim();

    return res.json({
      user: {
        firstName: user.personalInfo.legalFirstName,
        lastName: user.personalInfo.legalLastName,
        email: user.contactDetail.email,
        country: user.contactDetail.country,

        fullName,
        accountNumber: account.accountNumber,
        avatar: user.avatar || null,
      },
    });
  } catch (e) {
    console.error("USER INFO ERROR:", e);
    res.status(500).json({ error: e.message });
  }
};
