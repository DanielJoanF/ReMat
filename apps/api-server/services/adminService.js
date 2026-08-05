/**
 * Admin Service — Moderation, Verification, Banner Management & AI Monitoring
 *
 * All functions are restricted to ADMIN role.
 */
const { prisma } = require("@remat/database");

/**
 * Suspend an active material that violates rules.
 */
const suspendMaterial = async (materialId, reason) => {
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) {
    const err = new Error("Material not found");
    err.statusCode = 404;
    throw err;
  }

  const updated = await prisma.material.update({
    where: { id: materialId },
    data: {
      status: "REJECTED",
      description: reason ? `[SUSPENDED BY ADMIN: ${reason}] ${material.description}` : material.description
    }
  });

  return updated;
};

/**
 * Admin hard delete material.
 */
const deleteMaterialAdmin = async (materialId) => {
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) {
    const err = new Error("Material not found");
    err.statusCode = 404;
    throw err;
  }

  await prisma.material.delete({ where: { id: materialId } });
  return { id: materialId, deleted: true };
};

/**
 * List distributors with verification status.
 */
const listDistributorsAdmin = async () => {
  return prisma.distributorProfile.findMany({
    include: {
      user: { select: { id: true, email: true, name: true, phone: true } },
      _count: { select: { materials: true, transactions: true } }
    },
    orderBy: { createdAt: "desc" }
  });
};

/**
 * Approve or revoke distributor verification status.
 */
const verifyDistributor = async (distributorId, isVerified) => {
  const profile = await prisma.distributorProfile.findUnique({ where: { id: distributorId } });
  if (!profile) {
    const err = new Error("Distributor profile not found");
    err.statusCode = 404;
    throw err;
  }

  const updated = await prisma.distributorProfile.update({
    where: { id: distributorId },
    data: { isVerified: Boolean(isVerified) }
  });

  // Also sync User.isVerified
  await prisma.user.update({
    where: { id: profile.userId },
    data: { isVerified: Boolean(isVerified) }
  });

  return updated;
};

/**
 * List banners for admin.
 */
const listBannersAdmin = async () => {
  return prisma.banner.findMany({
    orderBy: [{ order: "asc" }, { id: "desc" }]
  });
};

/**
 * List active banners for public marketplace.
 */
const listPublicBanners = async () => {
  return prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" }
  });
};

/**
 * Create a new banner.
 */
const createBanner = async (adminUserId, data) => {
  const { title, imageUrl, linkUrl, isActive, order } = data;
  return prisma.banner.create({
    data: {
      title,
      imageUrl,
      linkUrl: linkUrl || null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      order: order ? parseInt(order) : 0,
      managedBy: adminUserId
    }
  });
};

/**
 * Update a banner.
 */
const updateBanner = async (bannerId, data) => {
  const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
  if (!banner) {
    const err = new Error("Banner not found");
    err.statusCode = 404;
    throw err;
  }

  return prisma.banner.update({
    where: { id: bannerId },
    data: {
      title: data.title !== undefined ? data.title : banner.title,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : banner.imageUrl,
      linkUrl: data.linkUrl !== undefined ? data.linkUrl : banner.linkUrl,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : banner.isActive,
      order: data.order !== undefined ? parseInt(data.order) : banner.order
    }
  });
};

/**
 * Delete a banner.
 */
const deleteBanner = async (bannerId) => {
  const banner = await prisma.banner.findUnique({ where: { id: bannerId } });
  if (!banner) {
    const err = new Error("Banner not found");
    err.statusCode = 404;
    throw err;
  }

  await prisma.banner.delete({ where: { id: bannerId } });
  return { id: bannerId, deleted: true };
};

/**
 * Get AI quality monitoring logs (alerts & low-similarity chat logs).
 */
const getAiMonitoringLogs = async () => {
  const [alerts, unhandledChats] = await Promise.all([
    prisma.materialAlert.findMany({
      include: {
        consumer: { select: { companyName: true, user: { select: { email: true } } } },
        category: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.chatMessage.findMany({
      where: { role: "ASSISTANT", contextUsed: { equals: null } },
      include: {
        conversation: { select: { consumer: { select: { companyName: true } } } }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  return {
    failedSearchAlerts: alerts,
    unhandledChatLogs: unhandledChats
  };
};

module.exports = {
  suspendMaterial,
  deleteMaterialAdmin,
  listDistributorsAdmin,
  verifyDistributor,
  listBannersAdmin,
  listPublicBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAiMonitoringLogs
};
