const express = require("express");
const categoryController = require("../controllers/categoryController");

const router = express.Router();

// Public: list all categories and get by ID
// Used by marketplace & material creation forms
router.get("/", categoryController.listCategories);
router.get("/:id", categoryController.getCategoryById);

module.exports = router;
