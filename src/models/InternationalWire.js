import mongoose from "mongoose";

const InternationalWireSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  recipientName: String,
  bankName: String,
  iban: String,
  swift: String,
  country: String,

  amount: Number,
  fee: { type: Number, default: 25 }, // flat international wire fee
  totalDebit: Number,

  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending"
  },

  reference: String,

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("InternationalWire", InternationalWireSchema);
