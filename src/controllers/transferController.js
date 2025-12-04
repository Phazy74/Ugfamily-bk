// import User from "../models/User.js";
// import Account from "../models/Account.js";
// import Transaction from "../models/Transaction.js";
// import bcrypt from "bcryptjs";

// function generateRef() {
//   return "TX-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
// }

// // --------------------------
// //  VALIDATE RECEIVER ACCOUNT
// // --------------------------
// // export const verifyBeneficiary = async (req, res) => {
// //   try {
// //     const { accountNumber } = req.body;

// //     const account = await Account.findOne({ accountNumber }).populate(
// //       "user",
// //       "personalInfo.legalFirstName personalInfo.legalLastName"
// //     );

// //     if (!account) {
// //       return res.status(404).json({ error: "Account not found" });
// //     }

// //     return res.json({
// //       name:
// //         account.user.personalInfo.legalFirstName +
// //         " " +
// //         account.user.personalInfo.legalLastName
// //     });
// //   } catch (e) {
// //     console.error("VERIFY BENEFICIARY ERROR:", e);
// //     return res.status(500).json({ error: e.message });
// //   }
// // };
// export const verifyBeneficiary = async (req, res) => {
//   try {
//     const { accountNumber } = req.body;

//     // Search user collection instead of account collection
//     const user = await User.findOne(
//       { accountNumber },
//       "personalInfo.legalFirstName personalInfo.middleName personalInfo.legalLastName"
//     );

//     if (!user) {
//       return res.status(404).json({ error: "Account not found" });
//     }

//     const fullName = 
//       user.personalInfo.legalFirstName +
//       " " +
//       (user.personalInfo.middleName || "") +
//       " " +
//       user.personalInfo.legalLastName;

//     return res.json({
//       success: true,
//       name: fullName.trim()
//     });

//   } catch (e) {
//     console.error("VERIFY BENEFICIARY ERROR:", e);
//     return res.status(500).json({ error: e.message });
//   }
// };

// // --------------------------
// //  LOCAL BANK TRANSFER
// // --------------------------
// export const localTransfer = async (req, res) => {
//   try {
//     const userId = req.user.userId;

//     const { accountNumber, amount, pin, description } = req.body;

//     if (!accountNumber || !amount || !pin)
//       return res
//         .status(400)
//         .json({ error: "accountNumber, amount, and pin are required" });

//     if (amount <= 0)
//       return res.status(400).json({ error: "Invalid transfer amount" });

//     // 1. Verify PIN
//     const senderUser = await User.findById(userId);
//     const pinCorrect = await bcrypt.compare(
//       pin,
//       senderUser.accountSetup.transactionPinHash
//     );

//     if (!pinCorrect)
//       return res.status(400).json({ error: "Incorrect transaction PIN" });

//     // 2. Get sender account
//     const senderAccount = await Account.findOne({ user: userId });

//     if (!senderAccount)
//       return res.status(404).json({ error: "Sender account not found" });

//     if (senderAccount.balances.usd.available < amount)
//       return res.status(400).json({ error: "Insufficient balance" });

//     // 3. Find receiver account
//     const receiverAccount = await Account.findOne({ accountNumber });

//     if (!receiverAccount)
//       return res.status(404).json({ error: "Receiver not found" });

//     if (receiverAccount.user.equals(userId))
//       return res
//         .status(400)
//         .json({ error: "You cannot transfer money to yourself" });

//     // 4. Execute Transfer
//     senderAccount.balances.usd.available -= amount;
//     senderAccount.balances.usd.ledger -= amount;

//     receiverAccount.balances.usd.available += amount;
//     receiverAccount.balances.usd.ledger += amount;

//     await senderAccount.save();
//     await receiverAccount.save();

//     // 5. Create Transaction
//     const transaction = await Transaction.create({
//       sender: userId,
//       receiver: receiverAccount.user,
//       amount,
//       description,
//       reference: generateRef()
//     });

//     // 6. Return receipt
//     return res.json({
//       message: "Transfer successful",
//       receipt: {
//         reference: transaction.reference,
//         amount,
//         toAccount: accountNumber,
//         description,
//         time: transaction.createdAt
//       }
//     });
//   } catch (e) {
//     console.error("LOCAL TRANSFER ERROR:", e);
//     return res.status(500).json({ error: e.message });
//   }
// };
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import { generateReference, calculateLocalFee, checkLimits } from "../utils/transfers.js";

// OPTIONAL: verify by User collection (as you requested)
export const verifyBeneficiary = async (req, res) => {
  try {
    const { accountNumber } = req.body;
    const user = await User.findOne(
      { accountNumber },
      "personalInfo.legalFirstName personalInfo.middleName personalInfo.legalLastName"
    );
    if (!user) return res.status(404).json({ error: "Account not found" });

    const fullName = [
      user.personalInfo.legalFirstName,
      user.personalInfo.middleName,
      user.personalInfo.legalLastName
    ].filter(Boolean).join(" ");

    res.json({ success: true, name: fullName.trim() });
  } catch (e) {
    console.error("VERIFY BENEFICIARY ERROR:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Professional Local Transfer
 * - currency: USD (matches your balances.usd)
 * - validates PIN
 * - checks daily/monthly limits
 * - idempotency via header `Idempotency-Key`
 * - atomic with Mongo transactions
 * Body: { accountNumber, amount, pin, description }
 */
export const localTransferPro = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user.userId;
    const { accountNumber, amount, pin, description = "" } = req.body;
    const idemKey = req.header("Idempotency-Key");

    // basic input
    if (!accountNumber || !amount || !pin) {
      return res.status(400).json({ error: "accountNumber, amount, and pin are required" });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // idempotency: if same idemKey was used and completed, return the previous receipt
    if (idemKey) {
      const existing = await Transaction.findOne({ idempotencyKey: idemKey, "sender.user": userId, status: "completed" });
      if (existing) {
        return res.json({
          message: "Transfer successful (idempotent replay)",
          receipt: {
            reference: existing.reference,
            amount: existing.amount,
            fee: existing.fee,
            currency: existing.currency,
            toAccount: existing.receiver.accountNumber,
            description: existing.description,
            time: existing.createdAt,
          }
        });
      }
    }

    // verify sender & PIN
    const senderUser = await User.findById(userId);
    if (!senderUser) return res.status(404).json({ error: "Sender not found" });

    const pinOK = await bcrypt.compare(pin, senderUser.accountSetup.transactionPinHash);
    if (!pinOK) return res.status(400).json({ error: "Incorrect transaction PIN" });

    await session.withTransaction(async () => {
      // load accounts within the session
      const senderAcct = await Account.findOne({ user: userId }).session(session);
      if (!senderAcct) throw new Error("Sender account not found");

      // Receiver lookup: by User collection since your accountNumber lives there
      const receiverUser = await User.findOne({ accountNumber }).session(session);
      if (!receiverUser) {
        // fallback: try Account collection if you later add it there
        throw new Error("Receiver not found");
      }
      if (receiverUser._id.equals(userId)) throw new Error("You cannot transfer to yourself");

      const receiverAcct = await Account.findOne({ user: receiverUser._id }).session(session);
      if (!receiverAcct) throw new Error("Receiver account not found");

      // limits
      const limitCheck = await checkLimits({ amount: amt, AccountModel: Account, TransactionModel: Transaction, userId, session });
      if (!limitCheck.ok) throw new Error(limitCheck.reason);

      // fee
      const fee = calculateLocalFee(amt);
      const totalDebit = amt + fee;

      // balance checks
      const senderAvail = Number(senderAcct.balances?.usd?.available || 0);
      const receiverAvail = Number(receiverAcct.balances?.usd?.available || 0);
      if (senderAvail < totalDebit) throw new Error("Insufficient balance");

      // snapshots
      const senderBefore = senderAvail;
      const receiverBefore = receiverAvail;

      // apply changes
      senderAcct.balances.usd.available = senderAvail - totalDebit;
      senderAcct.balances.usd.ledger = Number(senderAcct.balances.usd.ledger || senderBefore) - totalDebit;

      receiverAcct.balances.usd.available = receiverAvail + amt;
      receiverAcct.balances.usd.ledger = Number(receiverAcct.balances.usd.ledger || receiverBefore) + amt;

      await senderAcct.save({ session });
      await receiverAcct.save({ session });

      // create transaction record
      const tx = await Transaction.create([{
        type: "local_transfer",
        status: "completed",
        currency: "USD",
        amount: amt,
        fee,
        reference: generateReference(),
        idempotencyKey: idemKey,

        sender: {
          user: senderUser._id,
          accountNumber: senderUser.accountNumber || senderAcct.accountNumber, // support both styles
          balanceBefore: senderBefore,
          balanceAfter: senderAcct.balances.usd.available,
        },
        receiver: {
          user: receiverUser._id,
          accountNumber: receiverUser.accountNumber || receiverAcct.accountNumber,
          balanceBefore: receiverBefore,
          balanceAfter: receiverAcct.balances.usd.available,
        },

        description,
        initiatedBy: senderUser._id,
      }], { session });

      const saved = tx[0];

      // TODO (optional): enqueue notifications
      // await Notifications.enqueue({ ... })

      // respond
      res.json({
        message: "Transfer successful",
        receipt: {
          reference: saved.reference,
          amount: saved.amount,
          fee: saved.fee,
          currency: saved.currency,
          toAccount: saved.receiver.accountNumber,
          toName: `${receiverUser.personalInfo?.legalFirstName || ""} ${receiverUser.personalInfo?.legalLastName || ""}`.trim(),
          description: saved.description,
          time: saved.createdAt,
          balances: {
            senderAfter: saved.sender.balanceAfter,
            receiverAfter: saved.receiver.balanceAfter
          }
        }
      });
    });
  } catch (e) {
    console.error("LOCAL TRANSFER PRO ERROR:", e);
    // return friendly error
    res.status(400).json({ error: e.message });
  } finally {
    session.endSession();
  }
};

/** optional: simple history endpoint */
export const listTransfers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const txs = await Transaction.find({ "sender.user": userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ transactions: txs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
