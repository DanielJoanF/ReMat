const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validateRequired } = require("../middlewares/validate");
const transactionController = require("../controllers/transactionController");

const router = express.Router();

// Consumer: create transaction (order)
router.post(
  "/",
  requireAuth,
  requireRole("CONSUMER"),
  validateRequired(["items"]),
  transactionController.createTransaction
);

// Consumer: list my purchases
router.get(
  "/my",
  requireAuth,
  requireRole("CONSUMER"),
  transactionController.listConsumerTransactions
);

// Distributor: list my sales/orders
router.get(
  "/orders",
  requireAuth,
  requireRole("DISTRIBUTOR"),
  transactionController.listDistributorOrders
);

// Detail view (Consumer, Distributor, Admin)
router.get(
  "/:id",
  requireAuth,
  transactionController.getTransactionById
);

// Distributor: confirm order (PENDING -> CONFIRMED)
router.patch(
  "/:id/confirm",
  requireAuth,
  requireRole("DISTRIBUTOR"),
  transactionController.confirmOrder
);

// Distributor: mark order as shipped (PAID -> SHIPPED)
router.patch(
  "/:id/ship",
  requireAuth,
  requireRole("DISTRIBUTOR"),
  transactionController.markShipped
);

// Consumer: confirm receipt (SHIPPED -> COMPLETED)
router.patch(
  "/:id/receive",
  requireAuth,
  requireRole("CONSUMER"),
  transactionController.confirmReceived
);

// Cancel order (Consumer or Distributor)
router.patch(
  "/:id/cancel",
  requireAuth,
  transactionController.cancelTransaction
);

module.exports = router;
