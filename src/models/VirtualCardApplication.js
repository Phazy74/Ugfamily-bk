import mongoose from "mongoose";

const VirtualCardApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  cardType: { 
    type: String, 
    enum: ["visa", "mastercard", "amex"],
    required: true 
  },

  cardLevel: {
    type: String,
    enum: ["standard", "gold", "platinum", "premium"],
    required: true
  },

  currency: { type: String, required: true },

  dailyLimit: { type: Number, required: true },

  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model(
  "VirtualCardApplication",
  VirtualCardApplicationSchema
);
