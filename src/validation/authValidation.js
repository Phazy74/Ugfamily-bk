import { body } from "express-validator";
import { ACCOUNT_TYPES } from "../models/User.js";

const passwordPolicy =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[{\]};:'",.<>/?\\|`~]).{8,}$/;

export const registerRules = [
  // personal info
  body("personalInfo.legalFirstName").trim().notEmpty().withMessage("Legal First Name is required"),
  body("personalInfo.middleName").trim().notEmpty().withMessage("Middle Name is required"),
  body("personalInfo.legalLastName").trim().notEmpty().withMessage("Legal Last Name is required"),
  body("personalInfo.username").trim().notEmpty().isLength({ min: 1, max: 30 })
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage("Username: letters, numbers, . _ -"),

  // contact detail
  body("contactDetail.email").trim().isEmail().withMessage("Valid email required"),
  body("contactDetail.phone").trim().isLength({ min: 7, max: 20 }).withMessage("Valid phone required"),
  body("contactDetail.country").trim().notEmpty().withMessage("Country is required"),

  // account setup
  body("accountSetup.accountType").isIn(ACCOUNT_TYPES).withMessage("Invalid account type"),
  body("accountSetup.transactionPin").isLength({ min: 4, max: 4 })
    .matches(/^\d{4}$/).withMessage("Transaction PIN must be 4 digits"),

  // security
  body("security.password").matches(passwordPolicy)
    .withMessage("Password must be 8+ chars, 1 uppercase, 1 number, 1 special"),

  body("security.confirmPassword").custom((val, { req }) => {
    if (val !== req.body.security.password)
      throw new Error("Passwords do not match");
    return true;
  }),

  body("security.acceptTerms")
    .custom(value => {
      if (value === true || value === "true") return true;
      throw new Error("You must accept the Terms");
    })
];

export const loginRules = [
  body("email").isEmail(),
  body("password").notEmpty()
];
