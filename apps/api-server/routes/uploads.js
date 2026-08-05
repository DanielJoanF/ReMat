const express = require("express");
const multer = require("multer");
const { requireAuth, requireRole } = require("../middlewares/auth");
const uploadController = require("../controllers/uploadController");

const router = express.Router();

// Configure multer for memory storage (buffer → Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg", "image/png", "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: JPEG, PNG, WebP, PDF, DOC, DOCX"));
    }
  }
});

// Upload document to a material
router.post(
  "/:materialId/documents",
  requireAuth,
  requireRole("DISTRIBUTOR"),
  upload.single("file"),
  uploadController.uploadMaterialDocument
);

// Delete document from a material
router.delete(
  "/:materialId/documents/:docId",
  requireAuth,
  requireRole("DISTRIBUTOR"),
  uploadController.deleteMaterialDocument
);

module.exports = router;
