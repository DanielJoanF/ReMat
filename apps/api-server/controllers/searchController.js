const searchService = require("../services/searchService");

const smartSearch = async (req, res, next) => {
  try {
    const { q, categoryId, location, limit } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: { message: "Query parameter 'q' is required", statusCode: 400 }
      });
    }

    const result = await searchService.smartSearch(q.trim(), {
      categoryId,
      location,
      limit
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { smartSearch };
