const notificationService = require("../services/notificationService");

const listMyNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, limit } = req.query;
    const notifications = await notificationService.listNotifications(req.user.id, {
      unreadOnly: unreadOnly === "true",
      limit: limit ? parseInt(limit, 10) : 10
    });
    res.json({ data: notifications });
  } catch (err) {
    next(err);
  }
};

const countUnread = async (req, res, next) => {
  try {
    const count = await notificationService.countUnread(req.user.id);
    res.json({ data: { count } });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notif = await notificationService.markRead(req.params.id, req.user.id);
    res.json({ data: notif, message: "Notification marked as read" });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllRead(req.user.id);
    res.json({ data: result, message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

const seed = async (req, res, next) => {
  try {
    const result = await notificationService.seedNotifications(req.user.id);
    res.status(201).json({ data: result, message: `${result.count} notifikasi contoh dibuat` });
  } catch (err) {
    next(err);
  }
};

module.exports = { listMyNotifications, countUnread, markRead, markAllRead, seed };