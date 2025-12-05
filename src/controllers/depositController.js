// import axios from "axios";
// import Deposit from "../models/Deposit.js";
// import Account from "../models/Account.js";

// const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

// export const createDeposit = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const { amount } = req.body;

//     // Create NOWPayments payment
//     const payment = await axios.post(
//       "https://api.nowpayments.io/v1/payment",
//       {
//         price_amount: amount,
//         price_currency: "usd",
//         pay_currency: "usdttrc20",
//         ipn_callback_url: `${process.env.API_URL}/api/deposit/webhook`
//       },
//       {
//         headers: {
//           "x-api-key": NOWPAYMENTS_API_KEY,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     // Save deposit in DB
//     const deposit = await Deposit.create({
//       user: userId,
//       amount,
//       paymentId: payment.data.payment_id,
//       paymentUrl: payment.data.pay_url,
//     });

//     res.json({
//       message: "Deposit created",
//       paymentUrl: payment.data.pay_url,
//       deposit
//     });

//   } catch (e) {
//     console.error("CREATE DEPOSIT ERROR:", e);
//     res.status(500).json({ error: e.message });
//   }
// };
import axios from "axios";
import Deposit from "../models/Deposit.js";
import Account from "../models/Account.js";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

export const createUsdtDeposit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    // Create NOWPayments Invoice
    const invoice = await axios.post(
      "https://api.nowpayments.io/v1/invoice",
      {
        price_amount: amount,
        price_currency: "usd",
        pay_currency: "usdttrc20",
        order_id: "DEP-" + Date.now(),
        ipn_callback_url: `${process.env.API_URL}/api/deposit/webhook`,
      },
      {
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const data = invoice.data;

    // Save deposit to DB
    const deposit = await Deposit.create({
      user: userId,
      amount,
      address: data.pay_address,
      payAmount: data.pay_amount,
      invoiceId: data.id,
      status: data.payment_status,
    });

    return res.json({
      success: true,
      depositId: deposit._id,
      address: data.pay_address,
      payAmount: data.pay_amount,
      invoiceData: data,
    });

  } catch (e) {
    console.error("CREATE DEPOSIT ERROR:", e.response?.data || e);
    return res.status(500).json({ error: e.message });
  }
};
