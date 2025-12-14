import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const transactions = await Transaction.find({ user: userId })
      .sort({ transactionDate: -1, createdAt: -1 });

    res.json({ transactions });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
