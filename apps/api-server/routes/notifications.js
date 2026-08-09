const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

// Distributor: list my notifications (newest first)
router.get("/my", requireAuth, notificationController.listMyNotifications);

// Distributor: unread count
router.get("/unread-count", requireAuth, notificationController.countUnread);

// Distributor: mark one as read
router.patch("/:id/read", requireAuth, notificationController.markRead);

// Distributor: mark all as read
router.patch("/read-all", requireAuth, notificationController.markAllRead);

// DEV ONLY: seed example notifications for current user
router.post("/seed", requireAuth, notificationController.seed);

module.exports = router;