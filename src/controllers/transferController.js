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

// VERIFY BENEFICIARY
export const verifyBeneficiary = async (req, res) => {
  try {
    const { accountNumber } = req.body;

    if (!accountNumber) {
      return res.status(400).json({ error: "Account number is required" });
    }

    // 1. First, try to find the account number directly in the User collection
    let user = await User.findOne({ accountNumber });

    // 2. If it's NOT in the User collection, check the Account collection!
    if (!user) {
      // Find the account and 'populate' (fetch) the user attached to it
      const account = await Account.findOne({ accountNumber }).populate("user");
      
      if (account && account.user) {
        user = account.user; // We found the user!
      }
    }

    // 3. If STILL not found, then the account truly doesn't exist
    if (!user) {
      return res.status(404).json({ error: "Account not found. Please check the number." });
    }

    // 4. Safely extract the user's name
    let fullName = "Unknown User";
    
    if (user.personalInfo) {
      fullName =[
        user.personalInfo.legalFirstName,
        user.personalInfo.middleName,
        user.personalInfo.legalLastName
      ].filter(Boolean).join(" ");
      
      // Fallback: If they don't have legal names set yet, use their username
      if (!fullName.trim() && user.personalInfo.username) {
        fullName = user.personalInfo.username;
      }
    }

    // Return the verified name to the frontend!
    res.json({ success: true, name: fullName.trim() });

  } catch (e) {
    console.error("VERIFY BENEFICIARY ERROR:", e);
    res.status(500).json({ error: "Server error verifying account" });
  }
};

// LOCAL TRANSFER
export const localTransferPro = async (req, res) => {
  try {
    const userId = req.user.userId;
    // We grab the variables from the frontend
    const { accountNumber, amount, pin, description = "" } = req.body;

    if (!accountNumber || !amount || !pin) {
      return res.status(400).json({ error: "Account number, amount, and PIN are required" });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // 1. Verify Sender User & PIN
    const senderUser = await User.findById(userId);
    if (!senderUser) return res.status(404).json({ error: "Sender not found" });

    const pinOK = await bcrypt.compare(pin, senderUser.accountSetup.transactionPinHash);
    if (!pinOK) return res.status(400).json({ error: "Incorrect transaction PIN" });

    // 2. Load Sender Account
    const senderAcct = await Account.findOne({ user: userId });
    if (!senderAcct) return res.status(404).json({ error: "Sender account not found" });

    // 3. BULLETPROOF RECEIVER LOOKUP (Removes spaces and checks both databases)
    const cleanAccountNumber = String(accountNumber).trim();
    
    let receiverUser = await User.findOne({ accountNumber: cleanAccountNumber });
    let receiverAcct = null;

    if (!receiverUser) {
      receiverAcct = await Account.findOne({ accountNumber: cleanAccountNumber });
      if (receiverAcct) {
        receiverUser = await User.findById(receiverAcct.user);
      }
    } else {
      receiverAcct = await Account.findOne({ user: receiverUser._id });
    }

    // 🚨 Detailed Error Messages so we know exactly what fails
    if (!receiverUser) return res.status(404).json({ error: `User not found for account: ${cleanAccountNumber}` });
    if (!receiverAcct) return res.status(404).json({ error: "Receiver's wallet data is missing." });
    if (receiverUser._id.equals(userId)) return res.status(400).json({ error: "You cannot transfer money to yourself." });

    // 4. Calculate Fee & Check Balance
    const fee = typeof calculateLocalFee === 'function' ? calculateLocalFee(amt) : 0; 
    const totalDebit = amt + fee;

    const senderAvail = Number(senderAcct.balances?.usd?.available || 0);
    if (senderAvail < totalDebit) return res.status(400).json({ error: "Insufficient balance" });

    // 5. Apply Balance Changes
    senderAcct.balances.usd.available -= totalDebit;
    if (senderAcct.balances.usd.ledger !== undefined) senderAcct.balances.usd.ledger -= totalDebit;

    receiverAcct.balances.usd.available += amt;
    if (receiverAcct.balances.usd.ledger !== undefined) receiverAcct.balances.usd.ledger += amt;

    // Save changes to database
    await senderAcct.save();
    await receiverAcct.save();

    const baseRef = generateReference();

    // 6. CREATE SENDER TRANSACTION (Debit)
    await Transaction.create({
      user: userId,
      type: "transfer",
      direction: "debit",
      amount: totalDebit,
      status: "success",  
      reference: `${baseRef}-D`, 
      description: `Local Transfer to ${receiverUser.personalInfo.legalFirstName} ${receiverUser.personalInfo.legalLastName}`
    });

    // 7. CREATE RECEIVER TRANSACTION (Credit)
    await Transaction.create({
      user: receiverUser._id,
      type: "transfer",
      direction: "credit",
      amount: amt, 
      status: "success",
      reference: `${baseRef}-C`, 
      description: `Local Transfer from ${senderUser.personalInfo.legalFirstName} ${senderUser.personalInfo.legalLastName}`
    });

    // 8. Send Success Response to Frontend
    res.json({
      success: true,
      message: "Transfer successful",
      receipt: {
        reference: baseRef,
        amount: amt,
        fee: fee,
        toAccount: cleanAccountNumber,
        toName: `${receiverUser.personalInfo.legalFirstName} ${receiverUser.personalInfo.legalLastName}`
      }
    });

  } catch (e) {
    console.error("LOCAL TRANSFER ERROR:", e);
    res.status(500).json({ error: e.message || "Server error processing transfer" });
  }
};

// LIST TRANSFERS
export const listTransfers = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Look for transactions belonging to this user
    const txs = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, transactions: txs });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};