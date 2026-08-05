const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validateRequired } = require("../middlewares/validate");
const ratingController = require("../controllers/ratingController");

const router = express.Router({ mergeParams: true });

// Consumer: Rate a transaction
router.post(
  "/rate",
  requireAuth,
  requireRole("CONSUMER"),
  validateRequired(["score"]),
  ratingController.createRating
);

// Get rating for a transaction
router.get(
  "/rating",
  ratingController.getRatingByTransactionId
);

module.exports = router;
