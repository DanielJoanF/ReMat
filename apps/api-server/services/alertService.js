/**
 * Material Alert Service
 *
 * Allows consumers to create alerts for materials they're looking for
 * that aren't currently available. Used when semantic search returns
 * no results above the similarity threshold (ARCHITECTURE.md §5, Scenario #2).
 */
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
 * Create a material alert.
 */
const createAlert = async (userId, data) => {
  const consumerId = await getConsumerProfileId(userId);
  const { queryText, categoryId, locationFilter } = data;

  // Validate category if provided
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      const err = new Error("Category not found");
      err.statusCode = 404;
      throw err;
    }
  }

  const alert = await prisma.materialAlert.create({
    data: {
      consumerId,
      queryText,
      categoryId: categoryId || null,
      locationFilter: locationFilter || null,
      isActive: true
    },
    include: {
      category: { select: { id: true, name: true } }
    }
  });

  return alert;
};

/**
 * List active alerts for a consumer.
 */
const listMyAlerts = async (userId) => {
  const consumerId = await getConsumerProfileId(userId);

  return prisma.materialAlert.findMany({
    where: { consumerId, isActive: true },
    include: {
      category: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });
};

/**
 * Deactivate an alert.
 */
const deactivateAlert = async (alertId, userId) => {
  const consumerId = await getConsumerProfileId(userId);

  const alert = await prisma.materialAlert.findUnique({ where: { id: alertId } });
  if (!alert) {
    const err = new Error("Alert not found");
    err.statusCode = 404;
    throw err;
  }

  if (alert.consumerId !== consumerId) {
    const err = new Error("You can only manage your own alerts");
    err.statusCode = 403;
    throw err;
  }

  return prisma.materialAlert.update({
    where: { id: alertId },
    data: { isActive: false }
  });
};

module.exports = {
  createAlert,
  listMyAlerts,
  deactivateAlert
};
