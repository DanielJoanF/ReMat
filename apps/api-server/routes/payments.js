const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const paymentController = require("../controllers/paymentController");

const router = express.Router({ mergeParams: true });

// Consumer: Pay for a transaction
router.post(
  "/pay",
  requireAuth,
  requireRole("CONSUMER"),
  paymentController.createPayment
);

// Get payment detail for a transaction
router.get(
  "/payment",
  requireAuth,
  paymentController.getPaymentByTransactionId
);

module.exports = router;
