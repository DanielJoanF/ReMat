const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validateRequired } = require("../middlewares/validate");
const chatbotController = require("../controllers/chatbotController");

const router = express.Router();

// Consumer: create new chat session
router.post(
  "/conversations",
  requireAuth,
  requireRole("CONSUMER"),
  chatbotController.createConversation
);

// Consumer: list my chat sessions
router.get(
  "/conversations",
  requireAuth,
  requireRole("CONSUMER"),
  chatbotController.listConversations
);

// Consumer: send message in a chat session
router.post(
  "/conversations/:id/messages",
  requireAuth,
  requireRole("CONSUMER"),
  validateRequired(["message"]),
  chatbotController.sendMessage
);

// Consumer: get message history of a chat session
router.get(
  "/conversations/:id/messages",
  requireAuth,
  requireRole("CONSUMER"),
  chatbotController.getMessages
);

module.exports = router;
