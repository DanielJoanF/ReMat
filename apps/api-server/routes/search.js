const express = require("express");
const searchController = require("../controllers/searchController");

const router = express.Router();

// Public: AI smart search with pgvector + keyword fallback
router.get("/", searchController.smartSearch);

module.exports = router;
