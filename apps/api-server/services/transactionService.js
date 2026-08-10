const { prisma } = require("@remat/database");
const { getConsumerProfileId, getDistributorProfileId } = require("../utils/profile");

/** Format angka ke Rupiah singkat (contoh: Rp 1.130.000). */
const formatIDR = (n) =>
  `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

/**
 * Fire-and-forget in-app notification for a distributor (order events).
 * Never throws — notification failures must not break the order flow.
 */
const notifyDistributor = async (userId, type, title, message, relatedId = null, link = null) => {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message, relatedId, link }
    });
  } catch (err) {
    console.error("[notify] failed:", err.message);
  }
};

/**
 * Consumer creates a transaction (order).
 * items: [{ materialId, quantity }]
 */
const createTransaction = async (userId, data) => {
  const consumerId = await getConsumerProfileId(userId);
  const { items, shippingAddress } = data;

  if (!items || !Array.isArray(items) || items.length === 0) {
    const err = new Error("At least one item is required");
    err.statusCode = 400;
    throw err;
  }

  // Fetch all materials and validate
  const materialIds = items.map((i) => i.materialId);
  const materials = await prisma.material.findMany({
    where: { id: { in: materialIds }, status: "ACTIVE" },
    include: { distributor: { select: { id: true } } }
  });

  if (materials.length !== materialIds.length) {
    const err = new Error("One or more materials not found or not active");
    err.statusCode = 400;
    throw err;
  }

  // All items must be from the same distributor
  const distributorIds = [...new Set(materials.map((m) => m.distributor.id))];
  if (distributorIds.length > 1) {
    const err = new Error("All items in a transaction must be from the same distributor");
    err.statusCode = 400;
    throw err;
  }

  const distributorId = distributorIds[0];

  // Build transaction items with calculated subtotals
  const materialMap = {};
  for (const m of materials) {
    materialMap[m.id] = m;
  }

  let totalAmount = 0;
  const transactionItems = items.map((item) => {
    const mat = materialMap[item.materialId];
    const qty = parseFloat(item.quantity);

    if (qty <= 0) {
      const err = new Error(`Quantity must be positive for material ${mat.title}`);
      err.statusCode = 400;
      throw err;
    }

    if (qty > mat.quantity) {
      const err = new Error(`Requested quantity (${qty}) exceeds available stock (${mat.quantity}) for ${mat.title}`);
      err.statusCode = 400;
      throw err;
    }

    const subtotal = qty * mat.price;
    totalAmount += subtotal;

    return {
      materialId: item.materialId,
      quantity: qty,
      unitPrice: mat.price,
      subtotal
    };
  });

  // Create transaction with items in a single Prisma transaction
  const transaction = await prisma.transaction.create({
    data: {
      consumerId,
      distributorId,
      totalAmount,
      shippingAddress: shippingAddress || null,
      items: {
        create: transactionItems
      }
    },
    include: {
      items: { include: { material: { select: { id: true, title: true, unit: true } } } },
      consumer: { select: { id: true, companyName: true } },
      distributor: { select: { id: true, companyName: true, userId: true } }
    }
  });

  // Notify distributor of a new incoming order
  const distUser = transaction.distributor?.userId;
  if (distUser) {
    notifyDistributor(
      distUser,
      "order_new",
      "Pesanan Baru Masuk",
      `Ada pesanan baru senilai ${formatIDR(totalAmount)} menunggu konfirmasi Anda.`,
      transaction.id,
      `/orders/${transaction.id}`
    );
  }

  return transaction;
};

/**
 * List transactions for a consumer.
 */
const listConsumerTransactions = async (userId, query) => {
  const consumerId = await getConsumerProfileId(userId);
  const { status, page = 1, limit = 20 } = query;

  const where = { consumerId };
  if (status) where.status = status.toUpperCase();

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        items: { include: { material: { select: { id: true, title: true, unit: true } } } },
        distributor: { select: { id: true, companyName: true } },
        payment: { select: { id: true, status: true, method: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    prisma.transaction.count({ where })
  ]);

  return { data: transactions, pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) } };
};

/**
 * List orders received by a distributor.
 */
const listDistributorOrders = async (userId, query) => {
  const distributorId = await getDistributorProfileId(userId);
  const { status, search, page = 1, limit = 20 } = query;

  const where = { distributorId };
  if (status) where.status = status.toUpperCase();

  // Server-side search: order ID, buyer name, or ordered material title.
  // Prisma `contains` + insensitive maps to ILIKE on PostgreSQL.
  if (search && String(search).trim()) {
    const q = String(search).trim();
    where.AND = [
      {
        OR: [
          { id: { contains: q, mode: "insensitive" } },
          { consumer: { companyName: { contains: q, mode: "insensitive" } } },
          { items: { some: { material: { title: { contains: q, mode: "insensitive" } } } } }
        ]
      }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        items: { include: { material: { select: { id: true, title: true, unit: true } } } },
        consumer: { select: { id: true, companyName: true, user: { select: { name: true } } } },
        payment: { select: { id: true, status: true, method: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    prisma.transaction.count({ where })
  ]);

  return { data: transactions, pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) } };
};

/**
 * Get transaction by ID with ownership check.
 */
const getTransactionById = async (id, user) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      items: { include: { material: { select: { id: true, title: true, unit: true, materialCode: true } } } },
      consumer: { select: { id: true, companyName: true, userId: true, user: { select: { name: true } } } },
      distributor: { select: { id: true, companyName: true, userId: true, user: { select: { phone: true } } } },
      payment: true,
      rating: true
    }
  });

  if (!transaction) return null;

  // Admin can see any
  if (user.role === "ADMIN") return transaction;

  // Consumer or distributor involved
  if (transaction.consumer.userId === user.id || transaction.distributor.userId === user.id) {
    return transaction;
  }

  return null; // Not authorized
};

/**
 * Distributor confirms an order (PENDING → CONFIRMED).
 */
const confirmOrder = async (transactionId, userId) => {
  const distributorId = await getDistributorProfileId(userId);

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { id: true, status: true, distributorId: true }
  });

  if (!transaction) {
    const err = new Error("Transaction not found");
    err.statusCode = 404;
    throw err;
  }

  if (transaction.distributorId !== distributorId) {
    const err = new Error("You can only manage your own orders");
    err.statusCode = 403;
    throw err;
  }

  if (transaction.status !== "PENDING" && transaction.status !== "CONFIRMED") {
    const err = new Error(`Can only confirm PENDING or CONFIRMED orders. Current: ${transaction.status}`);
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "COMPLETED" }
  });

  // Notify distributor that the order was confirmed
  notifyDistributor(
    userId,
    "order_status",
    "Pesanan Selesai",
    "Pesanan telah dikonfirmasi oleh distributor dan selesai.",
    transactionId,
    `/orders/${transactionId}`
  );

  return updated;
};

/**
 * Distributor marks order as shipped (PAID → SHIPPED).
 */
const markShipped = async (transactionId, userId) => {
  const distributorId = await getDistributorProfileId(userId);

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { id: true, status: true, distributorId: true }
  });

  if (!transaction) {
    const err = new Error("Transaction not found");
    err.statusCode = 404;
    throw err;
  }

  if (transaction.distributorId !== distributorId) {
    const err = new Error("You can only manage your own orders");
    err.statusCode = 403;
    throw err;
  }

  if (transaction.status !== "PAID") {
    const err = new Error(`Can only ship PAID orders. Current: ${transaction.status}`);
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "SHIPPED" }
  });

  // Notify distributor that the order was shipped
  notifyDistributor(
    userId,
    "order_status",
    "Pesanan Dikirim",
    "Pesanan telah ditandai dikirim. Pembeli dapat melacak pengiriman.",
    transactionId,
    `/orders/${transactionId}`
  );

  return updated;
};

/**
 * Consumer confirms receipt (SHIPPED → COMPLETED).
 */
const confirmReceived = async (transactionId, userId) => {
  const consumerId = await getConsumerProfileId(userId);

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { id: true, status: true, consumerId: true }
  });

  if (!transaction) {
    const err = new Error("Transaction not found");
    err.statusCode = 404;
    throw err;
  }

  if (transaction.consumerId !== consumerId) {
    const err = new Error("You can only confirm your own orders");
    err.statusCode = 403;
    throw err;
  }

  if (transaction.status !== "SHIPPED") {
    const err = new Error(`Can only confirm receipt of SHIPPED orders. Current: ${transaction.status}`);
    err.statusCode = 400;
    throw err;
  }

  return prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "COMPLETED" }
  });
};

/**
 * Cancel a transaction (before COMPLETED, by either party).
 */
const cancelTransaction = async (transactionId, userId) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      consumer: { select: { userId: true } },
      distributor: { select: { userId: true } }
    }
  });

  if (!transaction) {
    const err = new Error("Transaction not found");
    err.statusCode = 404;
    throw err;
  }

  // Only involved parties can cancel
  if (transaction.consumer.userId !== userId && transaction.distributor.userId !== userId) {
    const err = new Error("You are not involved in this transaction");
    err.statusCode = 403;
    throw err;
  }

  if (transaction.status === "COMPLETED" || transaction.status === "CANCELLED") {
    const err = new Error(`Cannot cancel a ${transaction.status} transaction`);
    err.statusCode = 400;
    throw err;
  }

  return prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "CANCELLED" }
  });
};

module.exports = {
  createTransaction,
  listConsumerTransactions,
  listDistributorOrders,
  getTransactionById,
  confirmOrder,
  markShipped,
  confirmReceived,
  cancelTransaction
};
