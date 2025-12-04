// import VirtualCard from "../models/VirtualCard.js";
// import { generateCardNumber, generateExpiry, generateCVV } from "../utils/virtualCardGenerator.js";

// // ------------------------------------------------
// // CREATE VIRTUAL CARD
// // ------------------------------------------------
// export const createVirtualCard = async (req, res) => {
//   try {
//     const userId = req.user.userId;

//     const cardNumber = generateCardNumber();
//     const { month, year } = generateExpiry();
//     const cvv = generateCVV();

//     const newCard = await VirtualCard.create({
//       user: userId,
//       cardNumber,
//       expiryMonth: month,
//       expiryYear: year,
//       cvv,
//     });

//     return res.status(201).json({ message: "Card created", card: newCard });
//   } catch (e) {
//     console.error("CREATE CARD ERROR:", e);
//     return res.status(500).json({ error: e.message });
//   }
// };

// // ------------------------------------------------
// // GET ALL USER CARDS
// // ------------------------------------------------
// export const getUserCards = async (req, res) => {
//   try {
//     const userId = req.user.userId;
//     const cards = await VirtualCard.find({ user: userId }).sort({ createdAt: -1 });
//     return res.json({ cards });
//   } catch (e) {
//     return res.status(500).json({ error: e.message });
//   }
// };

// // ------------------------------------------------
// // FREEZE CARD
// // ------------------------------------------------
// export const freezeCard = async (req, res) => {
//   try {
//     const { cardId } = req.params;

//     const updated = await VirtualCard.findByIdAndUpdate(
//       cardId,
//       { status: "frozen" },
//       { new: true }
//     );

//     return res.json({ message: "Card frozen", card: updated });
//   } catch (e) {
//     return res.status(500).json({ error: e.message });
//   }
// };

// // ------------------------------------------------
// // UNFREEZE CARD
// // ------------------------------------------------
// export const unfreezeCard = async (req, res) => {
//   try {
//     const { cardId } = req.params;

//     const updated = await VirtualCard.findByIdAndUpdate(
//       cardId,
//       { status: "active" },
//       { new: true }
//     );

//     return res.json({ message: "Card activated", card: updated });
//   } catch (e) {
//     return res.status(500).json({ error: e.message });
//   }
// };

// // ------------------------------------------------
// // DELETE CARD
// // ------------------------------------------------
// export const deleteCard = async (req, res) => {
//   try {
//     const { cardId } = req.params;

//     await VirtualCard.findByIdAndDelete(cardId);

//     return res.json({ message: "Card deleted" });
//   } catch (e) {
//     return res.status(500).json({ error: e.message });
//   }
// };
// controllers/virtualCardController.js

import VirtualCard from "../models/VirtualCard.js";
import VirtualCardApplication from "../models/VirtualCardApplication.js";
import { generateCardNumber, generateExpiry, generateCVV } from "../utils/virtualCardGenerator.js";

/* ------------------------------------------------
    1. APPLY FOR A VIRTUAL CARD
-------------------------------------------------- */
export const applyForVirtualCard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { cardType, cardLevel, currency, dailyLimit } = req.body;

    if (!cardType || !cardLevel || !currency || !dailyLimit) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // store pending application
    const app = await VirtualCardApplication.create({
      user: userId,
      cardType,
      cardLevel,
      currency,
      dailyLimit,
      status: "pending",
    });

    return res.status(201).json({
      message: "Application submitted",
      application: app,
    });
  } catch (e) {
    console.error("APPLY CARD ERROR:", e);
    res.status(500).json({ error: e.message });
  }
};

/* ------------------------------------------------
    2. GET USER APPLICATIONS
-------------------------------------------------- */
export const getUserApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const apps = await VirtualCardApplication.find({ user: userId }).sort({ createdAt: -1 });

    return res.json({ applications: apps });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ------------------------------------------------
    3. APPROVE APPLICATION (ADMIN OR AUTO SYSTEM)
-------------------------------------------------- */
// export const approveVirtualCard = async (req, res) => {
//   try {
//     const { id } = req.params; // application ID

//     let app = await VirtualCardApplication.findById(id);
//     if (!app) return res.status(404).json({ error: "Application not found" });

//     if (app.status === "approved") {
//       return res.status(400).json({ error: "Already approved" });
//     }

//     // generate card details
//     const cardNumber = generateCardNumber(app.cardType);
//     const { month, year } = generateExpiry();
//     const cvv = generateCVV(app.cardType);

//     // create actual virtual card
//     const card = await VirtualCard.create({
//       user: app.user,
//       cardType: app.cardType,
//       cardLevel: app.cardLevel,
//       currency: app.currency,
//       dailyLimit: app.dailyLimit,
//       cardNumber,
//       expiryMonth: month,
//       expiryYear: year,
//       cvv,
//       status: "active",
//     });

//     // update application status
//     app.status = "approved";
//     await app.save();

//     return res.json({
//       message: "Virtual card approved",
//       card,
//     });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };
export const approveVirtualCard = async (req, res) => {
  try {
    const { id } = req.params; // application ID

    // 1. Fetch the application
    const app = await VirtualCardApplication.findById(id);
    if (!app) return res.status(404).json({ error: "Application not found" });

    if (app.status === "approved")
      return res.status(400).json({ error: "Already approved" });

    // 2. Update status to approved
    app.status = "approved";
    await app.save();

    // 3. Generate card values
    const cardNumber = generateCardNumber();
    const cvv = generateCVV();
    const { month, year } = generateExpiry();

    // 4. Create actual virtual card
    const card = await VirtualCard.create({
      user: app.user,
      cardType: app.cardType,
      cardLevel: app.cardLevel,
      currency: app.currency,
      dailyLimit: app.dailyLimit,
      cardNumber,
      cvv,
      expiryMonth: month,
      expiryYear: year,
      status: "active"
    });

    return res.json({
      message: "Application approved and card created!",
      card
    });

  } catch (e) {
    console.error("APPROVE CARD ERROR:", e);
    return res.status(500).json({ error: e.message });
  }
};
/* ------------------------------------------------
    4. GET USER VIRTUAL CARDS
-------------------------------------------------- */
export const getUserCards = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cards = await VirtualCard.find({ user: userId }).sort({ createdAt: -1 });
    return res.json({ cards });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ------------------------------------------------
    5. FREEZE CARD
-------------------------------------------------- */
export const freezeCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const updated = await VirtualCard.findByIdAndUpdate(
      cardId,
      { status: "frozen" },
      { new: true }
    );

    return res.json({ message: "Card frozen", card: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ------------------------------------------------
    6. UNFREEZE CARD
-------------------------------------------------- */
export const unfreezeCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const updated = await VirtualCard.findByIdAndUpdate(
      cardId,
      { status: "active" },
      { new: true }
    );

    return res.json({ message: "Card activated", card: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ------------------------------------------------
    7. DELETE CARD
-------------------------------------------------- */
export const deleteCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    await VirtualCard.findByIdAndDelete(cardId);

    return res.json({ message: "Virtual card deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
