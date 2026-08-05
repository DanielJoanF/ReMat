const { prisma } = require("@remat/database");

/**
 * Get consumer profile ID from user ID.
 */
const getConsumerProfileId = async (userId) => {
  const profile = await prisma.consumerProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  if (!profile) {
    const err = new Error("Consumer profile not found");
    err.statusCode = 404;
    throw err;
  }
  return profile.id;
};

/**
 * Consumer rates a completed transaction.
 */
const createRating = async (transactionId, userId, data) => {
  const consumerId = await getConsumerProfileId(userId);
  const { score, comment } = data;

  const scoreInt = parseInt(score);
  if (isNaN(scoreInt) || scoreInt < 1 || scoreInt > 5) {
    const err = new Error("Score must be an integer between 1 and 5");
    err.statusCode = 400;
    throw err;
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { rating: true }
  });

  if (!transaction) {
    const err = new Error("Transaction not found");
    err.statusCode = 404;
    throw err;
  }

  if (transaction.consumerId !== consumerId) {
    const err = new Error("You can only rate your own transactions");
    err.statusCode = 403;
    throw err;
  }

  if (transaction.status !== "COMPLETED") {
    const err = new Error(`Can only rate COMPLETED transactions. Current status: ${transaction.status}`);
    err.statusCode = 400;
    throw err;
  }

  if (transaction.rating) {
    const err = new Error("Transaction has already been rated");
    err.statusCode = 409;
    throw err;
  }

  const rating = await prisma.rating.create({
    data: {
      transactionId,
      consumerId,
      distributorId: transaction.distributorId,
      score: scoreInt,
      comment: comment || null
    }
  });

  return rating;
};

/**
 * Get rating for a transaction.
 */
const getRatingByTransactionId = async (transactionId) => {
  const rating = await prisma.rating.findUnique({
    where: { transactionId },
    include: {
      consumer: { select: { id: true, companyName: true } },
      distributor: { select: { id: true, companyName: true } }
    }
  });

  return rating;
};

module.exports = {
  createRating,
  getRatingByTransactionId
};
