const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validateRequired } = require("../middlewares/validate");
const categoryController = require("../controllers/categoryController");

const router = express.Router();

// Public
router.get("/", categoryController.listCategories);
router.get("/:id", categoryController.getCategoryById);

// Admin only
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateRequired(["name", "slug"]),
  categoryController.createCategory
);

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  categoryController.deleteCategory
);

module.exports = router;
