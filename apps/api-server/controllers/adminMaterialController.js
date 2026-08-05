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
    const { action } = req.body; // "approve" or "reject"

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

module.exports = { listPendingMaterials, reviewMaterial };
