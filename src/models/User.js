// import mongoose from "mongoose";

// const PersonalInfoSchema = new mongoose.Schema({
//   legalFirstName: { type: String, required: true, trim: true },
//   middleName:     { type: String, required: true, trim: true },
//   legalLastName:  { type: String, required: true, trim: true },
//   username:       { type: String, required: true, trim: true, unique: true, lowercase: true }
// }, { _id: false });

// const ContactDetailSchema = new mongoose.Schema({
//   email:   { type: String, required: true, unique: true, lowercase: true, trim: true },
//   phone:   { type: String, required: true, unique: true, trim: true },
//   country: { type: String, required: true, trim: true }
// }, { _id: false });

// const ACCOUNT_TYPES = [
//   "Checking Account",
//   "Savings Account",
//   "Fixed Deposit Account",
//   "Current Account",
//   "Crypto Currency Account",
//   "Business Account",
//   "Non Resident Account",
//   "Cooperate Business Account",
//   "Investment Account"
// ];

// const AccountSetupSchema = new mongoose.Schema({
//   accountType: { type: String, enum: ACCOUNT_TYPES, required: true },
//   transactionPinHash: { type: String, required: true } // hash of 4-digit PIN
// }, { _id: false });

// const SecuritySchema = new mongoose.Schema({
//   passwordHash: { type: String, required: true },
//   termsAcceptedAt: { type: Date, required: true }
// }, { _id: false });

// const UserSchema = new mongoose.Schema({
//   personalInfo:   { type: PersonalInfoSchema, required: true },
//   contactDetail:  { type: ContactDetailSchema, required: true },
//   accountSetup:   { type: AccountSetupSchema, required: true },
//   security:       { type: SecuritySchema, required: true },

//   // status flags before KYC
//   isEmailVerified: { type: Boolean, default: false },
//   isPhoneVerified: { type: Boolean, default: false },
//   kycTermsAccepted: { type: Boolean, default: false },
//   hasAcceptedTerms: { type: Boolean, default: false },
//   kycCompleted: { type: Boolean, default: false },

//   // housekeeping
//   lastLoginAt: { type: Date },
//   createdBy:   { type: String, default: "self" }
// }, { timestamps: true });


// const KycSchema = new mongoose.Schema({
//   personal: {
//     fullName: { type: String, trim: true },
//     phone: { type: String, trim: true },
//     email: { type: String, lowercase: true, trim: true },
//     title: { type: String, enum: ["Mr", "Mrs", "Miss", "Ms", "Dr", "Prof", "Other"], default: "Mr" },
//     gender: { type: String, enum: ["Male","Female","Other"] },
//     zipcode: { type: String, trim: true },
//     dob: { type: String, trim: true }, // store ISO date string or YYYY-MM-DD
//   },
//   employment: {
//     idType: { type: String, enum: ["SSN","NIN","SIN","BVN","Other"], default: "SSN" },
//     idNumber: { type: String, trim: true },
//     accountType: {
//       type: String,
//       enum: [
//         "Checking Account",
//         "Savings Account",
//         "Fixed Deposit Account",
//         "Current Account",
//         "Crypto Currency Account",
//         "Business Account",
//         "Non Resident Account",
//         "Cooperate Business Account",
//         "Investment Account"
//       ]
//     },
//     employmentType: {
//       type: String,
//       enum: ["Employed","Self Employed","Student","Unemployed","Retired","Other"]
//     },
//     salaryRange: {
//       type: String, // e.g. "$0–$1,000", "$1,001–$5,000", etc.
//       trim: true
//     }
//   },
//   nextOfKin: {
//     beneficiaryLegalName: { type: String, trim: true },
//     address: { type: String, trim: true },
//     age: { type: Number, min: 0, max: 150 },
//     relationship: { type: String, trim: true }
//   },
//   documents: {
//     docType: { type: String, enum: ["International Passport","National ID","Driver License"] },
//     frontUrl: { type: String },
//     backUrl: { type: String }
//   },
//   status: {
//     termsAccepted: { type: Boolean, default: false }, // you already track separately; keep synced
//     submitted: { type: Boolean, default: false },
//     approved: { type: Boolean, default: false },
//     reviewedAt: { type: Date },
//   }
// }, { _id: false });

// // Add to your main schema:
// UserSchema.add({
//   kyc: { type: KycSchema, default: () => ({}) },
//   hasAcceptedTerms: { type: Boolean, default: false },
//   kycCompleted: { type: Boolean, default: false },
// });




// export default mongoose.model("User", UserSchema);
// export { ACCOUNT_TYPES };
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
  transactionPinHash: { type: String, required: true }
}, { _id: false });

const SecuritySchema = new mongoose.Schema({
  passwordHash: { type: String, required: true },
  termsAcceptedAt: { type: Date, required: true }
}, { _id: false });

const KycSchema = new mongoose.Schema({
  personal: {
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    title: { type: String, enum: ["Mr","Mrs","Miss","Ms","Dr","Prof","Other"] },
    gender: { type: String, enum: ["Male","Female","Other"] },
    zipcode: { type: String, trim: true },
    dob: { type: String, trim: true },
  },
  employment: {
    idType: { type: String, enum: ["SSN","NIN","SIN","BVN","Other"] },
    idNumber: { type: String, trim: true },
    accountType: { type: String, enum: ACCOUNT_TYPES },
    employmentType: { type: String, enum: ["Employed","Self Employed","Student","Unemployed","Retired","Other"] },
    salaryRange: { type: String, trim: true }
  },
  nextOfKin: {
    beneficiaryLegalName: { type: String, trim: true },
    address: { type: String, trim: true },
    age: { type: Number, min: 0, max: 150 },
    relationship: { type: String, trim: true }
  },
  documents: {
    docType: { type: String, enum: ["International Passport","National ID","Driver License"] },
    frontUrl: String,
    backUrl: String
  },
  status: {
    termsAccepted: { type: Boolean, default: false },
    submitted: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    reviewedAt: { type: Date },
  }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  personalInfo:   { type: PersonalInfoSchema, required: true },
  contactDetail:  { type: ContactDetailSchema, required: true },
  accountSetup:   { type: AccountSetupSchema, required: true },
  security:       { type: SecuritySchema, required: true },

  // NEW UNIQUE CUSTOMER ID + ACCOUNT NUMBER
  uniqueId: { type: String, unique: true },
  accountNumber: { type: String, unique: true },

  // status flags
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  kycTermsAccepted: { type: Boolean, default: false },
  hasAcceptedTerms: { type: Boolean, default: false },
  kycCompleted: { type: Boolean, default: false },

avatarUrl: { type: String, default: null },     // public URL served to client
  avatarKey: { type: String, default: null },     // local filename (or cloud key)
  // ...


  lastLoginAt: { type: Date },
  createdBy:   { type: String, default: "self" },

  kyc: { type: KycSchema, default: () => ({}) }
}, { timestamps: true });

/* ------------------------------
   AUTO-GENERATE IDS
------------------------------- */
function generateTenDigit() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

UserSchema.pre("save", async function (next) {
  if (!this.uniqueId) {
    this.uniqueId = generateTenDigit();
  }
  if (!this.accountNumber) {
    this.accountNumber = generateTenDigit();
  }
  
});

export default mongoose.model("User", UserSchema);
export { ACCOUNT_TYPES };
