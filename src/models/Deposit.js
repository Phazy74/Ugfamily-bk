// import mongoose from "mongoose";

// const DepositSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

//   amount: { type: Number, required: true }, // USD value
//   currency: { type: String, default: "usdttrc20" },

//   paymentId: { type: String },         // NOWPayments payment ID
//   paymentUrl: { type: String },        // Checkout URL

//   status: {
//     type: String,
//     enum: ["pending", "confirmed", "failed"],
//     default: "pending"
//   },

//   txHash: { type: String },
//   createdAt: { type: Date, default: Date.now }
// });

// export default mongoose.model("Deposit", DepositSchema);
import mongoose from "mongoose";

const DepositSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: Number,
    address: String,
    payAmount: Number,
    invoiceId: Number,
    status: {
      type: String,
      enum: ["waiting", "confirming", "finished", "expired", "failed"],
      default: "waiting",
    }
  },
  { timestamps: true }
);

export default mongoose.model("Deposit", DepositSchema);
