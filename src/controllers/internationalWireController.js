import InternationalWire from "../models/InternationalWire.js";
import Account from "../models/Account.js";
import { generateReference } from "../utils/refGenerator.js";

export const sendInternationalWire = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recipientName, bankName, iban, swift, country, amount } = req.body;

    const fee = 25;
    const totalDebit = Number(amount) + fee;

    // load account balance
    const account = await Account.findOne({ user: userId });

    if (!account) return res.status(404).json({ error: "Account not found" });

    if (account.balances.usd.available < totalDebit)
      return res.status(400).json({ error: "Insufficient balance" });

    // deduct
    account.balances.usd.available -= totalDebit;
    account.balances.usd.ledger -= totalDebit;
    await account.save();

    const reference = generateReference();

    const transfer = await InternationalWire.create({
      user: userId,
      recipientName,
      bankName,
      iban,
      swift,
      country,
      amount,
      fee,
      totalDebit,
      reference,
      status: "pending",
    });

    return res.json({
      message: "Wire transfer submitted",
      reference,
      transfer
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

export const verifyInternationalBeneficiary = async (req, res) => {
  try {
    const { iban, swift } = req.body;

    if (!iban || iban.length < 10)
      return res.status(400).json({ error: "Invalid IBAN format." });

    if (!swift || swift.length !== 8)
      return res.status(400).json({ error: "Invalid SWIFT code." });

    return res.json({
      valid: true,
      message: "Bank details verified"
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

