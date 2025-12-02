import mongoose from "mongoose";

const PersonalInfoSchema = new mongoose.Schema({
  legalFirstName: { type: String, required: true, trim: true },
  middleName:     { type: String, required: true, trim: true },
  legalLastName:  { type: String, required: true, trim: true },
  username:       { type: String, required: true, trim: true, unique: true, lowercase: true }
}, { _id: false });

const ContactDetailSchema = new mongoose.Schema({
  email:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:   { type: String, required: true, unique: true, trim: true },
  country: { type: String, required: true, trim: true }
}, { _id: false });

const ACCOUNT_TYPES = [
  "Checking Account",
  "Savings Account",
  "Fixed Deposit Account",
  "Current Account",
  "Crypto Currency Account",
  "Business Account",
  "Non Resident Account",
  "Cooperate Business Account",
  "Investment Account"
];

const AccountSetupSchema = new mongoose.Schema({
  accountType: { type: String, enum: ACCOUNT_TYPES, required: true },
  transactionPinHash: { type: String, required: true } // hash of 4-digit PIN
}, { _id: false });

const SecuritySchema = new mongoose.Schema({
  passwordHash: { type: String, required: true },
  termsAcceptedAt: { type: Date, required: true }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  personalInfo:   { type: PersonalInfoSchema, required: true },
  contactDetail:  { type: ContactDetailSchema, required: true },
  accountSetup:   { type: AccountSetupSchema, required: true },
  security:       { type: SecuritySchema, required: true },

  // status flags before KYC
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },

  // housekeeping
  lastLoginAt: { type: Date },
  createdBy:   { type: String, default: "self" }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
export { ACCOUNT_TYPES };
