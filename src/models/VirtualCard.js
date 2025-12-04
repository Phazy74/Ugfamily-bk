import mongoose from "mongoose";

const VirtualCardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  cardType: { type: String, enum: ["visa", "mastercard", "amex"], required: true },
  cardLevel: { type: String, required: true },
  currency: { type: String, required: true },

  cardNumber: { type: String, required: true },
  expiryMonth: { type: Number, required: true },
  expiryYear: { type: Number, required: true },
  cvv: { type: String, required: true },

  dailyLimit: { type: Number, required: true },

  status: { type: String, enum: ["active", "frozen"], default: "active" },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("VirtualCard", VirtualCardSchema);
