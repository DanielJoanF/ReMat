const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validateRequired } = require("../middlewares/validate");
const alertController = require("../controllers/alertController");

const router = express.Router();

// Consumer: create alert
router.post(
  "/",
  requireAuth,
  requireRole("CONSUMER"),
  validateRequired(["queryText"]),
  alertController.createAlert
);

// Consumer: list my alerts
router.get(
  "/my",
  requireAuth,
  requireRole("CONSUMER"),
  alertController.listMyAlerts
);

// Consumer: deactivate alert
router.patch(
  "/:id/deactivate",
  requireAuth,
  requireRole("CONSUMER"),
  alertController.deactivateAlert
);

module.exports = router;
