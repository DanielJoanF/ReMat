const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validateRequired } = require("../middlewares/validate");
const materialController = require("../controllers/materialController");

const router = express.Router();

// Public
router.get("/", materialController.listPublicMaterials);

// Distributor: own materials (must be BEFORE /:id to avoid route conflict)
router.get(
  "/my",
  requireAuth,
  requireRole("DISTRIBUTOR"),
  materialController.listMyMaterials
);

// Public detail (with visibility rules applied in service)
router.get("/:id", materialController.getMaterialById);

// Distributor: create material
router.post(
  "/",
  requireAuth,
  requireRole("DISTRIBUTOR"),
  validateRequired(["title", "description", "categoryId", "quantity", "unit", "price", "location"]),
  materialController.createMaterial
);

// Distributor: update material (owner only)
router.put(
  "/:id",
  requireAuth,
  requireRole("DISTRIBUTOR"),
  materialController.updateMaterial
);

// Distributor: delete material (owner only)
router.delete(
  "/:id",
  requireAuth,
  requireRole("DISTRIBUTOR"),
  materialController.deleteMaterial
);

// Distributor: submit for review (owner only)
router.patch(
  "/:id/submit",
  requireAuth,
  requireRole("DISTRIBUTOR"),
  materialController.submitForReview
);

module.exports = router;
