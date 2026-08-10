const adminService = require("../services/adminService");
const materialService = require("../services/materialService");

const listPendingMaterials = async (req, res, next) => {
  try {
    const result = await materialService.listPendingMaterials(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const reviewMaterial = async (req, res, next) => {
  try {
    const { action } = req.body;
    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        error: { message: "Invalid action. Must be 'approve' or 'reject'", statusCode: 400 }
      });
    }

    const material = await materialService.reviewMaterial(req.params.id, action);
    const verb = action === "approve" ? "approved" : "rejected";
    res.json({ data: material, message: `Material ${verb} successfully` });
  } catch (err) {
    next(err);
  }
};

const suspendMaterial = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const material = await adminService.suspendMaterial(req.params.id, reason);
    res.json({ data: material, message: "Material suspended successfully" });
  } catch (err) {
    next(err);
  }
};

const deleteMaterial = async (req, res, next) => {
  try {
    const result = await adminService.deleteMaterialAdmin(req.params.id);
    res.json({ data: result, message: "Material deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const embeddingService = require("../services/embeddingService");

const reprocessEmbeddings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const includeLowQuality = req.query.includeLowQuality === "true";
    const result = await embeddingService.reprocessStaleEmbeddings({ limit, includeLowQuality });
    res.json({ data: result, message: "Stale/failed embeddings reprocess job completed" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listPendingMaterials,
  reviewMaterial,
  suspendMaterial,
  deleteMaterial,
  reprocessEmbeddings
};
