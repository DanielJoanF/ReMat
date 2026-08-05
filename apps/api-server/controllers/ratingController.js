const ratingService = require("../services/ratingService");

const createRating = async (req, res, next) => {
  try {
    const rating = await ratingService.createRating(req.params.transactionId, req.user.id, req.body);
    res.status(201).json({ data: rating, message: "Rating submitted successfully" });
  } catch (err) {
    next(err);
  }
};

const getRatingByTransactionId = async (req, res, next) => {
  try {
    const rating = await ratingService.getRatingByTransactionId(req.params.transactionId);
    if (!rating) {
      return res.status(404).json({ error: { message: "Rating not found", statusCode: 404 } });
    }
    res.json({ data: rating });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRating,
  getRatingByTransactionId
};
