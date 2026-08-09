const { prisma } = require("@remat/database");

/**
 * Notification service — in-app notifications for distributor users.
 * Type keys: order_new | order_status | stock_low | payment_received | material_verification
 */

/**
 * Create a notification row for a distributor user.
 * @param {object} params { userId, type, title, message, relatedId?, link? }
 */
const createNotification = async ({ userId, type, title, message, relatedId = null, link = null }) => {
  return prisma.notification.create({
    data: { userId, type, title, message, relatedId, link }
  });
};

/**
 * List notifications for a user (newest first), optionally only unread.
 */
const listNotifications = async (userId, { unreadOnly = false, limit = 10 } = {}) => {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit
  });
};

/**
 * Count unread notifications for a user.
 */
const countUnread = async (userId) => {
  return prisma.notification.count({ where: { userId, isRead: false } });
};

/**
 * Mark a single notification as read (ownership-checked).
 */
const markRead = async (notificationId, userId) => {
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif) {
    const err = new Error("Notification not found");
    err.statusCode = 404;
    throw err;
  }
  if (notif.userId !== userId) {
    const err = new Error("You can only manage your own notifications");
    err.statusCode = 403;
    throw err;
  }
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
};

/**
 * Mark all notifications as read for a user.
 */
const markAllRead = async (userId) => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
  return { count: result.count };
};

/**
 * Seed a handful of example notifications for a distributor user (dev/test only,
 * NOT production data — production notifications come from system events).
 */
const seedNotifications = async (userId) => {
  const now = Date.now();
  const samples = [
    { type: "order_new", title: "Pesanan Baru Masuk", message: "Ada pesanan baru menunggu konfirmasi Anda.", relatedId: null, link: "/orders", minutesAgo: 5 },
    { type: "payment_received", title: "Pembayaran Diterima", message: "Pembayaran untuk pesanan telah diterima.", relatedId: null, link: "/orders", minutesAgo: 65 },
    { type: "stock_low", title: "Stok Material Menipis", message: "Salah satu material Anda hampir habis.", relatedId: null, link: "/materials", minutesAgo: 300 },
  ];
  for (const s of samples) {
    await prisma.notification.create({
      data: {
        userId,
        type: s.type,
        title: s.title,
        message: s.message,
        relatedId: s.relatedId,
        link: s.link,
        isRead: s.minutesAgo > 60,
        createdAt: new Date(now - s.minutesAgo * 60_000)
      }
    });
  }
  return { count: samples.length };
};

module.exports = {
  createNotification,
  listNotifications,
  countUnread,
  markRead,
  markAllRead,
  seedNotifications
};