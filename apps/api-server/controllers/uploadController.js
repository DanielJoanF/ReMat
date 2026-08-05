const { prisma } = require("@remat/database");
const storageService = require("../services/storageService");

/**
 * Upload a document (PHOTO/CERTIFICATE/MSDS) for a material.
 */
const uploadMaterialDocument = async (req, res, next) => {
  try {
    const { materialId } = req.params;
    const { type } = req.body; // PHOTO, CERTIFICATE, MSDS

    if (!req.file) {
      return res.status(400).json({ error: { message: "No file uploaded", statusCode: 400 } });
    }

    if (!type || !["PHOTO", "CERTIFICATE", "MSDS"].includes(type.toUpperCase())) {
      return res.status(400).json({
        error: { message: "Invalid document type. Must be PHOTO, CERTIFICATE, or MSDS", statusCode: 400 }
      });
    }

    // Verify material exists and is owned by user
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: { distributor: { select: { userId: true } } }
    });

    if (!material) {
      return res.status(404).json({ error: { message: "Material not found", statusCode: 404 } });
    }

    if (material.distributor.userId !== req.user.id) {
      return res.status(403).json({ error: { message: "You can only upload documents to your own materials", statusCode: 403 } });
    }

    // Upload to Supabase Storage
    const folder = `${materialId}/${type.toLowerCase()}s`;
    const fileUrl = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    // Create MaterialDocument record
    const doc = await prisma.materialDocument.create({
      data: {
        materialId,
        type: type.toUpperCase(),
        fileUrl
      }
    });

    res.status(201).json({ data: doc });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a document from a material.
 */
const deleteMaterialDocument = async (req, res, next) => {
  try {
    const { materialId, docId } = req.params;

    // Verify ownership
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: { distributor: { select: { userId: true } } }
    });

    if (!material) {
      return res.status(404).json({ error: { message: "Material not found", statusCode: 404 } });
    }

    if (material.distributor.userId !== req.user.id) {
      return res.status(403).json({ error: { message: "You can only delete documents from your own materials", statusCode: 403 } });
    }

    const doc = await prisma.materialDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.materialId !== materialId) {
      return res.status(404).json({ error: { message: "Document not found", statusCode: 404 } });
    }

    // Delete from storage
    await storageService.deleteFile(doc.fileUrl);

    // Delete record
    await prisma.materialDocument.delete({ where: { id: docId } });

    res.json({ message: "Document deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadMaterialDocument, deleteMaterialDocument };
