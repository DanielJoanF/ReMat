/**
 * Analytics Engine Service — Pure SQL / Prisma Aggregation
 *
 * Computes business metrics directly from PostgreSQL database.
 * ZERO LLM dependency for numeric calculations (ARCHITECTURE.md §2.5, AGENT.md §4).
 *
 * Strictly enforces tenant isolation per distributorId.
 */
const { prisma } = require("@remat/database");

/**
 * Get distributor profile for a given user ID.
 */
const getDistributorProfile = async (userId) => {
  const profile = await prisma.distributorProfile.findUnique({
    where: { userId },
    select: { id: true, companyName: true }
  });
  if (!profile) {
    const err = new Error("Distributor profile not found");
    err.statusCode = 404;
    throw err;
  }
  return profile;
};

/**
 * Calculate analytics metrics for a distributor (Tenant Isolated).
 *
 * @param {string} userId
 * @returns {Promise<object>} Clean structured metrics
 */
const getDistributorMetrics = async (userId) => {
  const distributor = await getDistributorProfile(userId);
  const distributorId = distributor.id;

  // 1. Transaction status counts & revenues
  const transactions = await prisma.transaction.findMany({
    where: { distributorId },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      createdAt: true
    }
  });

  let totalCompletedRevenue = 0;
  let totalPendingRevenue = 0;
  const statusCounts = {
    PENDING: 0,
    CONFIRMED: 0,
    PAID: 0,
    SHIPPED: 0,
    COMPLETED: 0,
    CANCELLED: 0
  };

  transactions.forEach((tx) => {
    statusCounts[tx.status] = (statusCounts[tx.status] || 0) + 1;
    if (tx.status === "COMPLETED" || tx.status === "PAID") {
      totalCompletedRevenue += tx.totalAmount;
    } else if (tx.status === "PENDING" || tx.status === "CONFIRMED" || tx.status === "SHIPPED") {
      totalPendingRevenue += tx.totalAmount;
    }
  });

  // 2. Material inventory counts & total value
  const materials = await prisma.material.findMany({
    where: { distributorId },
    select: {
      id: true,
      title: true,
      price: true,
      quantity: true,
      unit: true,
      status: true,
      categoryId: true,
      category: { select: { name: true } }
    }
  });

  let activeMaterialCount = 0;
  let draftMaterialCount = 0;
  let totalActiveInventoryValue = 0;
  const categoryMap = {};

  materials.forEach((mat) => {
    if (mat.status === "ACTIVE") {
      activeMaterialCount++;
      totalActiveInventoryValue += mat.price * mat.quantity;
    } else if (mat.status === "DRAFT") {
      draftMaterialCount++;
    }

    const catName = mat.category?.name || "Uncategorized";
    if (!categoryMap[catName]) {
      categoryMap[catName] = { count: 0, totalValue: 0 };
    }
    categoryMap[catName].count++;
    if (mat.status === "ACTIVE") {
      categoryMap[catName].totalValue += mat.price * mat.quantity;
    }
  });

  // 3. Top selling materials (from transaction items)
  const transactionItems = await prisma.transactionItem.findMany({
    where: {
      transaction: { distributorId, status: { in: ["COMPLETED", "PAID", "SHIPPED"] } }
    },
    select: {
      materialId: true,
      quantity: true,
      subtotal: true,
      material: { select: { title: true, unit: true } }
    }
  });

  const materialSalesMap = {};
  transactionItems.forEach((item) => {
    const matId = item.materialId;
    const title = item.material?.title || "Unknown Material";
    if (!materialSalesMap[matId]) {
      materialSalesMap[matId] = { title, totalQuantity: 0, totalRevenue: 0 };
    }
    materialSalesMap[matId].totalQuantity += item.quantity;
    materialSalesMap[matId].totalRevenue += item.subtotal;
  });

  const topMaterials = Object.values(materialSalesMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  return {
    companyName: distributor.companyName,
    distributorId,
    summary: {
      completedRevenue: totalCompletedRevenue,
      pendingRevenue: totalPendingRevenue,
      totalTransactions: transactions.length,
      activeMaterials: activeMaterialCount,
      draftMaterials: draftMaterialCount,
      estimatedInventoryValue: totalActiveInventoryValue
    },
    transactionBreakdown: statusCounts,
    topSellingMaterials: topMaterials,
    categoryBreakdown: categoryMap
  };
};

/**
 * Calculate platform-wide aggregate metrics for Admin.
 */
const getAdminMetrics = async () => {
  const [
    totalDistributors,
    totalConsumers,
    transactions,
    materials
  ] = await Promise.all([
    prisma.distributorProfile.count(),
    prisma.consumerProfile.count(),
    prisma.transaction.findMany({ select: { status: true, totalAmount: true } }),
    prisma.material.findMany({ select: { status: true, price: true, quantity: true } })
  ]);

  let totalRevenue = 0;
  const statusCounts = {};
  transactions.forEach((tx) => {
    statusCounts[tx.status] = (statusCounts[tx.status] || 0) + 1;
    if (tx.status === "COMPLETED" || tx.status === "PAID") {
      totalRevenue += tx.totalAmount;
    }
  });

  let activeMaterials = 0;
  materials.forEach((m) => {
    if (m.status === "ACTIVE") activeMaterials++;
  });

  return {
    companyName: "Platform Admin ReMat",
    summary: {
      totalDistributors,
      totalConsumers,
      totalRevenue,
      totalTransactions: transactions.length,
      activeMaterials
    },
    transactionBreakdown: statusCounts
  };
};

module.exports = {
  getDistributorMetrics,
  getAdminMetrics,
  getDistributorProfile
};
