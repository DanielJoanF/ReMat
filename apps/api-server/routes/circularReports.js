const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const circularReportController = require("../controllers/circularReportController");

const router = express.Router();

// Admin: trigger manual report generation for distributor/period
router.post(
  "/generate",
  requireAuth,
  requireRole("ADMIN"),
  circularReportController.generateReport
);

// Distributor: generate a report for their OWN profile (tenant-scoped)
router.post(
  "/my/generate",
  requireAuth,
  requireRole("DISTRIBUTOR"),
  circularReportController.generateMyReport
);

// Distributor: list my historical circular reports
router.get(
  "/my",
  requireAuth,
  requireRole("DISTRIBUTOR"),
  circularReportController.listMyReports
);

// Distributor / Admin: view report detail (tenant-gated)
router.get(
  "/:id",
  requireAuth,
  circularReportController.getReportById
);

module.exports = router;
