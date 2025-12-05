// import express from "express";
// import { createDeposit } from "../controllers/depositController.js";
// import { depositWebhook } from "../controllers/depositWebhook.js";
// import {requireAuth} from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.post("/create", requireAuth, createDeposit);
// router.post("/webhook", depositWebhook); // public

// export default router;
import express from "express";
import {requireAuth} from "../middleware/authMiddleware.js";
import { createUsdtDeposit } from "../controllers/depositController.js";
import { nowpaymentsWebhook } from "../controllers/depositWebhook.js";

const router = express.Router();

router.post("/create", requireAuth , createUsdtDeposit);
router.post("/webhook", nowpaymentsWebhook);

export default router;
