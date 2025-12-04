// import express from "express";
// import { requireAuth } from "../middleware/authMiddleware.js";
// import {
//   localTransfer,
//   verifyBeneficiary
// } from "../controllers/transferController.js";

// const router = express.Router();

// router.post("/verify-beneficiary", requireAuth, verifyBeneficiary);
// router.post("/local", requireAuth, localTransfer);

// export default router;
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  verifyBeneficiary,
  localTransferPro,
  listTransfers
} from "../controllers/transferController.js";

const router = express.Router();

router.post("/verify-beneficiary", requireAuth, verifyBeneficiary);
router.post("/local", requireAuth, localTransferPro);
router.get("/history", requireAuth, listTransfers);

export default router;
