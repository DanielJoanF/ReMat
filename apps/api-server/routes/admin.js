const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validateRequired } = require("../middlewares/validate");
const adminController = require("../controllers/adminController");

const router = express.Router();

// All routes require ADMIN role
router.use(requireAuth, requireRole("ADMIN"));

// Material Moderation (Verifikasi Penjualan)
router.get("/materials/pending", adminController.listPendingMaterials);
router.patch("/materials/:id/review", adminController.reviewMaterial);
router.patch("/materials/:id/suspend", adminController.suspendMaterial);
router.delete("/materials/:id", adminController.deleteMaterial);

module.exports = router;
