const express = require("express");
const adminService = require("../services/adminService");

const router = express.Router();

// Public: get active promotional banners
router.get("/", async (req, res, next) => {
  try {
    const banners = await adminService.listPublicBanners();
    res.json({ data: banners });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
