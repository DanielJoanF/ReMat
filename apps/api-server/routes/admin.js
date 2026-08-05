const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const adminMaterialController = require("../controllers/adminMaterialController");

const router = express.Router();

// All admin routes require ADMIN role
router.use(requireAuth, requireRole("ADMIN"));

// List materials pending review
router.get("/materials/pending", adminMaterialController.listPendingMaterials);

// Approve or reject a material
router.patch("/materials/:id/review", adminMaterialController.reviewMaterial);

module.exports = router;
