// import mongoose from "mongoose";

// const TransactionSchema = new mongoose.Schema({
//   sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

//   amount: { type: Number, required: true },
//   currency: { type: String, default: "USD" },

//   description: { type: String, default: "" },
//   reference: { type: String, required: true },

//   type: { type: String, default: "local_transfer" },

//   createdAt: { type: Date, default: Date.now }
// });

// export default mongoose.model("Transaction", TransactionSchema);
import mongoose from "mongoose";

const PartySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountNumber: { type: String, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
}, { _id: false });

const TransactionSchema = new mongoose.Schema({
  // business fields
  type: { type: String, enum: ["local_transfer"], required: true },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
  currency: { type: String, default: "USD" },

  amount: { type: Number, required: true },           // principal
  fee: { type: Number, default: 0 },                   // charged to sender
  reference: { type: String, unique: true, index: true, required: true },
  idempotencyKey: { type: String, index: true },       // optional: prevent dup submits (per sender)

  // parties
  sender: { type: PartySchema, required: true },
  receiver: { type: PartySchema, required: true },

  // free form notes
  description: { type: String, default: "" },

  // metadata for audits
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
}, { minimize: false });

TransactionSchema.index({ "sender.user": 1, createdAt: -1 });
TransactionSchema.index({ idempotencyKey: 1, "sender.user": 1 }, { sparse: true });

export default mongoose.model("Transaction", TransactionSchema);
