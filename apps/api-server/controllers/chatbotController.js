const chatbotService = require("../services/chatbotService");

const createConversation = async (req, res, next) => {
  try {
    const conversation = await chatbotService.createConversation(req.user.id);
    res.status(201).json({ data: conversation });
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const conversationId = req.params.id;

    const result = await chatbotService.sendMessage(req.user.id, conversationId, message);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const messages = await chatbotService.getConversationMessages(req.user.id, req.params.id);
    res.json({ data: messages });
  } catch (err) {
    next(err);
  }
};

const listConversations = async (req, res, next) => {
  try {
    const conversations = await chatbotService.listMyConversations(req.user.id);
    res.json({ data: conversations });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createConversation,
  sendMessage,
  getMessages,
  listConversations
};
