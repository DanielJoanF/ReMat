const materialService = require("../services/materialService");

const listPublicMaterials = async (req, res, next) => {
  try {
    const result = await materialService.listPublicMaterials(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const listMyMaterials = async (req, res, next) => {
  try {
    const result = await materialService.listMyMaterials(req.user.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getMaterialById = async (req, res, next) => {
  try {
    const material = await materialService.getMaterialById(req.params.id, req.user);
    if (!material) {
      return res.status(404).json({ error: { message: "Material not found", statusCode: 404 } });
    }
    res.json({ data: material });
  } catch (err) {
    next(err);
  }
};

const createMaterial = async (req, res, next) => {
  try {
    const material = await materialService.createMaterial(req.user.id, req.body);
    res.status(201).json({ data: material });
  } catch (err) {
    next(err);
  }
};

const updateMaterial = async (req, res, next) => {
  try {
    const material = await materialService.updateMaterial(req.params.id, req.user.id, req.body);
    res.json({ data: material });
  } catch (err) {
    next(err);
  }
};

const deleteMaterial = async (req, res, next) => {
  try {
    await materialService.deleteMaterial(req.params.id, req.user.id);
    res.json({ message: "Material deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const submitForReview = async (req, res, next) => {
  try {
    const material = await materialService.submitForReview(req.params.id, req.user.id);
    res.json({ data: material, message: "Material submitted for review" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listPublicMaterials,
  listMyMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  submitForReview
};
