// import express from "express";
// import {
//   createVirtualCard,
//   getUserCards,
//   freezeCard,
//   unfreezeCard,
//   deleteCard,
// } from "../controllers/virtualCardController.js";
// import { requireAuth } from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.post("/create", requireAuth , createVirtualCard);
// router.get("/", requireAuth , getUserCards);
// router.patch("/freeze/:cardId", requireAuth , freezeCard);
// router.patch("/unfreeze/:cardId", requireAuth , unfreezeCard);
// router.delete("/:cardId", requireAuth , deleteCard);

// export default router;
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";

import {
  applyForVirtualCard,
  getUserApplications,
  approveVirtualCard,
  getUserCards,
  freezeCard,
  unfreezeCard,
  deleteCard
} from "../controllers/virtualCardController.js";

const router = express.Router();

// User applies for a card
router.post("/apply", requireAuth, applyForVirtualCard);

// User sees their own pending & approved applications
router.get("/applications", requireAuth, getUserApplications);

// Admin/system approves an application
router.post("/approve/:id", approveVirtualCard);

// User virtual card list
router.get("/cards", requireAuth, getUserCards);

// Freeze / Unfreeze / Delete
router.patch("/freeze/:cardId", requireAuth, freezeCard);
router.patch("/unfreeze/:cardId", requireAuth, unfreezeCard);
router.delete("/:cardId", requireAuth, deleteCard);

export default router;
