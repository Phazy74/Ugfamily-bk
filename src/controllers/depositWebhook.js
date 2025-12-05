// import Deposit from "../models/Deposit.js";
// import Account from "../models/Account.js";

// export const depositWebhook = async (req, res) => {
//   try {
//     const data = req.body;

//     const { payment_id, payment_status, pay_amount, pay_currency } = data;

//     // find deposit
//     const deposit = await Deposit.findOne({ paymentId: payment_id });

//     if (!deposit) {
//       return res.status(404).json({ error: "Deposit not found" });
//     }

//     // Only credit after full confirmation
//     if (payment_status === "confirmed") {
//       // credit user's USDT
//       const account = await Account.findOne({ user: deposit.user });

//       account.balances.usdt.available += pay_amount;
//       account.balances.usdt.ledger += pay_amount;
//       await account.save();

//       deposit.status = "confirmed";
//       deposit.txHash = data.payin_hash;
//       await deposit.save();

//       return res.json({ message: "Deposit confirmed & user credited!" });
//     }

//     // Handle failed
//     if (payment_status === "failed") {
//       deposit.status = "failed";
//       await deposit.save();
//     }

//     res.json({ message: "Webhook received" });

//   } catch (e) {
//     console.error("WEBHOOK ERROR:", e);
//     res.status(500).json({ error: e.message });
//   }
// };
import Deposit from "../models/Deposit.js";
import Account from "../models/Account.js";

export const nowpaymentsWebhook = async (req, res) => {
  try {
    const body = req.body;

    const deposit = await Deposit.findOne({ invoiceId: body.invoice_id });
    if (!deposit) return res.sendStatus(404);

    deposit.status = body.payment_status;
    await deposit.save();

    // WHEN PAYMENT IS COMPLETED
    if (body.payment_status === "finished") {
      await Account.findOneAndUpdate(
        { user: deposit.user },
        {
          $inc: {
            "balances.usdt.available": Number(body.pay_amount),
            "balances.usdt.ledger": Number(body.pay_amount),
          },
        }
      );
    }

    return res.sendStatus(200);
  } catch (e) {
    console.error("WEBHOOK ERROR:", e);
    res.sendStatus(500);
  }
};
