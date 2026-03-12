// backend/routes/adminUserCrud.js
import bcrypt from "bcryptjs";
import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";

const router = express.Router();

function generateReference() {
  return "TRX-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
}

// ---- ADJUST WALLET BALANCE ----
router.post("/:id/wallet/adjust", adminAuth, async (req, res) => {
  try {
    const { amount, action, currency = "usd" } = req.body;
    const userId = req.params.id;

    const amt = Number(amount);
    if (!["credit", "debit"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const account = await Account.findOne({ user: userId });
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const balance = account.balances[currency];
    if (!balance) {
      return res.status(400).json({ success: false, message: "Invalid currency" });
    }

    if (action === "credit") {
      balance.available += amt;
      balance.ledger += amt;
    } else {
      if (balance.available < amt) {
        return res.status(400).json({ success: false, message: "Insufficient balance" });
      }
      balance.available -= amt;
      balance.ledger -= amt;
    }

    await account.save();

    await Transaction.create({
      user: userId,
      amount: amt,
      type: action === "credit" ? "deposit" : "transfer",
      direction: action,
      status: "success",
      description: `Admin ${action} of ${amt} ${currency.toUpperCase()}`,
      reference: generateReference(),
    });

    return res.json({
      success: true,
      message: `Wallet ${action}ed successfully`,
      balance: account.balances[currency],
    });

  } catch (err) {
    console.error("ADJUST WALLET:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---- ADD CUSTOM TRANSACTION ----
router.post("/:id/transaction", adminAuth, async (req, res) => {
  try {
    const { type, direction, amount, currency = "usd", description } = req.body;
    const userId = req.params.id;

    if (!type || !direction || !amount) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const account = await Account.findOne({ user: userId });
    if (!account) return res.status(404).json({ success: false, message: "Account not found" });

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0)
      return res.status(400).json({ success: false, message: "Invalid amount" });

    const balance = account.balances[currency];
    if (!balance) {
      return res.status(400).json({ success: false, message: "Invalid currency" });
    }

    // UPDATE BALANCE
    if (direction === "credit") {
      balance.available += amt;
      balance.ledger += amt;
    } else if (direction === "debit") {
      if (balance.available < amt) {
        return res.status(400).json({ success: false, message: "Insufficient balance" });
      }
      balance.available -= amt;
      balance.ledger -= amt;
    } else {
      return res.status(400).json({ success: false, message: "Invalid direction" });
    }

    await account.save();

    // CREATE TRANSACTION
    const reference = generateReference();

    const tx = await Transaction.create({
      user: userId,
      type,          
      direction,     
      amount: amt,
      status: "success",
      currency,
      description: description || `Admin ${direction} ${amount} ${currency}`,
      reference,
    });

    res.json({
      success: true,
      message: "Transaction added",
      transaction: tx,
      balance: account.balances[currency],
    });

  } catch (err) {
    console.error("ADMIN CREATE TX ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- LIST ALL USERS ----
router.get("/list", adminAuth, async (req, res) => {
  try {
    const search = req.query.search || "";

    const query = search
      ? {
          $or:[
            { "personalInfo.username": { $regex: search, $options: "i" } },
            { "contactDetail.email": { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const users = await User.find(query).select(
      "personalInfo contactDetail status account balances"
    );

    res.json({ success: true, users });
  } catch (e) {
    console.error("ADMIN LIST USERS ERROR:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ⭐ FIXED: GET ALL TRANSACTIONS FOR ONE USER ⭐
router.get("/:id/transactions", adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 🔴 FIXED THIS: Changed { userId } to { user: userId } to match your database schema
    const [items, total] = await Promise.all([
      Transaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ user: userId })
    ]);

    return res.json({
      success: true,
      items,
      page,
      pages: Math.ceil(total / limit) || 1,
      total
    });

  } catch (err) {
    console.error("ADMIN TX LIST ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---- CREATE USER ----
router.post("/", adminAuth, async (req, res) => {
  try {
    const { personalInfo, contactDetail, accountSetup, security, createdBy = "admin" } = req.body;

    if (!security || !security.password || !security.transactionPin) {
      return res.status(400).json({
        success: false,
        message: "Password and transaction PIN are required",
      });
    }

    const passwordHash = await bcrypt.hash(String(security.password), 12);
    const transactionPinHash = await bcrypt.hash(String(security.transactionPin), 12);

    const clash = await User.findOne({
      $or:[
        { "contactDetail.email": contactDetail.email },
        { "personalInfo.username": personalInfo.username },
      ],
    });

    if (clash) {
      return res.status(400).json({ message: "Email or username already exists" });
    }

    const user = await User.create({
      personalInfo,
      contactDetail,
      accountSetup: {
        ...accountSetup,
        transactionPinHash, 
      },
      security: {
        passwordHash,      
        termsAcceptedAt: new Date(), 
      },
      createdBy,
    });

    const generateAccountNumber = () =>
      "4" + Math.floor(100000000 + Math.random() * 900000000); 

    const generateAccountId = () =>
      "ACCT-" + Date.now() + "-" + Math.floor(Math.random() * 10000);

    await Account.create({
      user: user._id,
      accountNumber: generateAccountNumber(),
      accountId: generateAccountId(),
      balances: {
        usd: { available: 0, ledger: 0 },
        usdt: { available: 0, ledger: 0 },
        btc: { available: 0, ledger: 0 },
      },
    });

    res.json({ success: true, user });

  } catch (e) {
    console.error("CREATE USER:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------- READ (View User Details) -------- */
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const account = await Account.findOne({ user: user._id });

    res.json({ success: true, user, account });
  } catch (e) {
    console.error("GET USER:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------- UPDATE (Modify User fields) -------- */
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (updates.accountBalances) {
      const account = await Account.findOne({ user: userId });

      if (account) {
        const { usd, usdt, btc } = updates.accountBalances;

        if (usd !== undefined) {
          account.balances.usd.available = usd;
          account.balances.usd.ledger = usd;
        }
        if (usdt !== undefined) {
          account.balances.usdt.available = usdt;
          account.balances.usdt.ledger = usdt;
        }
        if (btc !== undefined) {
          account.balances.btc.available = btc;
          account.balances.btc.ledger = btc;
        }

        await account.save();
      }
    }

    res.json({ success: true, user });

  } catch (e) {
    console.error("UPDATE USER:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------- UPDATE STATUS (active/suspended) -------- */
router.put("/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body; 
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user });
  } catch (e) {
    console.error("STATUS USER:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------- DELETE -------- */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // ⭐ FIXED THIS TOO: Changed userId to user
    await Transaction.deleteMany({ user: user._id });
    
    res.json({ success: true, message: "User deleted" });
  } catch (e) {
    console.error("DELETE USER:", e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;