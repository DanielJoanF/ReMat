const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validateRequired } = require("../middlewares/validate");
const adminController = require("../controllers/adminController");

const router = express.Router();

// All routes require ADMIN role
router.use(requireAuth, requireRole("ADMIN"));

// Material Moderation
router.get("/materials/pending", adminController.listPendingMaterials);
router.patch("/materials/:id/review", adminController.reviewMaterial);
router.patch("/materials/:id/suspend", adminController.suspendMaterial);
router.delete("/materials/:id", adminController.deleteMaterial);

// Distributor Verification
router.get("/distributors", adminController.listDistributors);
router.patch("/distributors/:id/verify", adminController.verifyDistributor);

// Banner Management (Admin)
router.get("/banners", adminController.listBanners);
router.post("/banners", validateRequired(["title", "imageUrl"]), adminController.createBanner);
router.put("/banners/:id", adminController.updateBanner);
router.delete("/banners/:id", adminController.deleteBanner);

// AI Quality Monitoring Logs
router.get("/ai-monitoring", adminController.getAiMonitoringLogs);

module.exports = router;
