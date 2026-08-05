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

const listDistributors = async (req, res, next) => {
  try {
    const distributors = await adminService.listDistributorsAdmin();
    res.json({ data: distributors });
  } catch (err) {
    next(err);
  }
};

const verifyDistributor = async (req, res, next) => {
  try {
    const { isVerified } = req.body;
    const distributor = await adminService.verifyDistributor(req.params.id, isVerified);
    res.json({ data: distributor, message: `Distributor verification status set to ${isVerified}` });
  } catch (err) {
    next(err);
  }
};

const listBanners = async (req, res, next) => {
  try {
    const banners = await adminService.listBannersAdmin();
    res.json({ data: banners });
  } catch (err) {
    next(err);
  }
};

const createBanner = async (req, res, next) => {
  try {
    const banner = await adminService.createBanner(req.user.id, req.body);
    res.status(201).json({ data: banner, message: "Banner created successfully" });
  } catch (err) {
    next(err);
  }
};

const updateBanner = async (req, res, next) => {
  try {
    const banner = await adminService.updateBanner(req.params.id, req.body);
    res.json({ data: banner, message: "Banner updated successfully" });
  } catch (err) {
    next(err);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    const result = await adminService.deleteBanner(req.params.id);
    res.json({ data: result, message: "Banner deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const getAiMonitoringLogs = async (req, res, next) => {
  try {
    const logs = await adminService.getAiMonitoringLogs();
    res.json({ data: logs });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listPendingMaterials,
  reviewMaterial,
  suspendMaterial,
  deleteMaterial,
  listDistributors,
  verifyDistributor,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAiMonitoringLogs
};
