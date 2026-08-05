const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const analyticsController = require("../controllers/analyticsController");

const router = express.Router();

// Auth required: DISTRIBUTOR or ADMIN
router.get(
  "/dashboard",
  requireAuth,
  analyticsController.getDashboardInsight
);

module.exports = router;
