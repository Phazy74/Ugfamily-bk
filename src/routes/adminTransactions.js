import Transaction from "../models/Transaction.js";
import express from "express";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/transactions", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, search } = req.query;

    const query = {};

    // Filter by type
    if (type) query.type = type;

    // Filter by status
    if (status) query.status = status;

    // Search by reference number
    if (search) query.reference = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;

    const total = await Transaction.countDocuments(query);

    const items = await Transaction.find(query)
      .populate("user", "personalInfo.username contactDetail.email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("ADMIN GET TRANSACTIONS ERROR:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



router.put("/transaction/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["success", "pending", "failed"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: "Not found" });

    tx.status = status;
    await tx.save();

    res.json({ success: true, transaction: tx });
  } catch (e) {
    console.error("ADMIN UPDATE TX STATUS ERROR:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * DELETE TRANSACTION
 */
router.delete("/transaction/:id", adminAuth, async (req, res) => {
  try {
    const tx = await Transaction.findByIdAndDelete(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, message: "Transaction deleted" });
  } catch (e) {
    console.error("ADMIN DELETE TX ERROR:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * UPDATE TRANSACTION DATE (createdAt)
 */
router.put("/transaction/:id/date", adminAuth, async (req, res) => {
  try {
    const { transactionDate } = req.body;

    if (!transactionDate) {
      return res
        .status(400)
        .json({ success: false, message: "Date is required" });
    }

    const tx = await Transaction.findByIdAndUpdate(
      req.params.id,
      { transactionDate: new Date(transactionDate) },
      { new: true }
    );

    if (!tx) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    res.json({ success: true, transaction: tx });
  } catch (e) {
    console.error("ADMIN UPDATE TX DATE ERROR:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});




export default router;