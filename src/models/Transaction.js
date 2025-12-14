
import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
  type: String,
  enum: ["deposit", "withdrawal", "transfer", "card", "custom"],
  required: true,
},
    direction: { type: String, enum: ["credit", "debit"], required: true },

    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["success", "pending", "failed"],
      default: "pending",
    },

    description: { type: String },

    reference: {
      type: String,
      unique: true,
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
export default mongoose.model("Transaction", TransactionSchema); 



