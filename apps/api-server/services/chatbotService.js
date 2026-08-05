/**
 * Chatbot Service — Multi-Turn AI Assistant with RAG Augmentation & Guardrails
 *
 * Architecture (ARCHITECTURE.md §3.4, §6.1, AGENT.md §5):
 *   1. State Management: Max 5 previous messages per conversation for chat_history.
 *   2. Retrieval: Phase 6 RAG pipeline (smartSearch) to fetch relevant ACTIVE materials.
 *   3. Augmentation: Delimited XML prompt (system_instructions, context, chat_history, user_input).
 *   4. Generation & Guardrails: Strict anti-hallucination & anti-injection prompt engineering.
 *   5. Data Audit: Saves user & assistant messages to ChatMessage; populates contextUsed JSON with material IDs.
 */
const { prisma } = require("@remat/database");
const { buildChatbotPrompt, generateText, isLlmAvailable } = require("@remat/ai-core");
const searchService = require("./searchService");

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
 * Start a new chat conversation session.
 */
const createConversation = async (userId) => {
  const consumerId = await getConsumerProfileId(userId);

  const conversation = await prisma.chatConversation.create({
    data: {
      consumerId
    }
  });

  return conversation;
};

/**
 * Send a message in a conversation session and receive AI Assistant reply.
 *
 * @param {string} userId - Authenticated user ID
 * @param {string} conversationId - Conversation session ID
 * @param {string} userMessage - User's message text
 */
const sendMessage = async (userId, conversationId, userMessage) => {
  const consumerId = await getConsumerProfileId(userId);

  if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
    const err = new Error("Message text is required");
    err.statusCode = 400;
    throw err;
  }

  // 1. Verify conversation session ownership
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) {
    const err = new Error("Conversation session not found");
    err.statusCode = 404;
    throw err;
  }

  if (conversation.consumerId !== consumerId) {
    const err = new Error("You can only access your own chat sessions");
    err.statusCode = 403;
    throw err;
  }

  const cleanMessage = userMessage.trim();

  // 2. Fetch last 5 previous messages for multi-turn history
  const recentMessages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  // Reverse so history is in chronological order (oldest to newest)
  const history = recentMessages.reverse().map((m) => ({
    role: m.role,
    content: m.content
  }));

  // 3. Save user message to database
  const userMsgRecord = await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "USER",
      content: cleanMessage
    }
  });

  // 4. Retrieval Pipeline: Search Phase 6 RAG for top 3 matching materials
  let retrievedMaterials = [];
  let materialIds = [];

  try {
    const searchResult = await searchService.smartSearch(cleanMessage, { limit: 3 });
    if (searchResult.data && searchResult.data.length > 0) {
      retrievedMaterials = searchResult.data;
      materialIds = retrievedMaterials.map((m) => m.id);
    }
  } catch (err) {
    console.warn(`[Chatbot] RAG retrieval warning: ${err.message}`);
  }

  // 5. Prompt Assembly & Guardrails
  const { systemPrompt, userPrompt } = buildChatbotPrompt({
    userMessage: cleanMessage,
    retrievedMaterials,
    history
  });

  // 6. LLM Generation
  let replyText = "";

  try {
    if (!isLlmAvailable()) {
      throw new Error("LLM API not configured");
    }

    replyText = await generateText(systemPrompt, userPrompt);
  } catch (err) {
    console.warn(`[Chatbot] LLM generation fallback: ${err.message}`);

    if (retrievedMaterials.length > 0) {
      replyText = `Saya menemukan ${retrievedMaterials.length} material yang relevan:\n` +
        retrievedMaterials.map((m) => `- ${m.title} (Rp ${Number(m.price).toLocaleString("id-ID")}/${m.unit}, Lokasi: ${m.location})`).join("\n") +
        "\n\nAda yang ingin Anda tanyakan lebih lanjut?";
    } else {
      replyText = "Maaf, material spesifik yang Anda cari belum tersedia di platform saat ini. Anda dapat menekan tombol 'Buat Alert' untuk mendapatkan notifikasi saat material tersedia.";
    }
  }

  // 7. Save Assistant message with contextUsed audit field
  const assistantMsgRecord = await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content: replyText,
      contextUsed: materialIds.length > 0 ? materialIds : null
    }
  });

  // 8. Touch lastActiveAt on conversation
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { lastActiveAt: new Date() }
  });

  return {
    userMessage: userMsgRecord,
    assistantMessage: assistantMsgRecord,
    retrievedMaterials
  };
};

/**
 * List message history for a conversation session.
 */
const getConversationMessages = async (userId, conversationId) => {
  const consumerId = await getConsumerProfileId(userId);

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) {
    const err = new Error("Conversation session not found");
    err.statusCode = 404;
    throw err;
  }

  if (conversation.consumerId !== consumerId) {
    const err = new Error("You can only access your own chat sessions");
    err.statusCode = 403;
    throw err;
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" }
  });

  return messages;
};

/**
 * List all active conversation sessions for a consumer.
 */
const listMyConversations = async (userId) => {
  const consumerId = await getConsumerProfileId(userId);

  return prisma.chatConversation.findMany({
    where: { consumerId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { lastActiveAt: "desc" }
  });
};

module.exports = {
  createConversation,
  sendMessage,
  getConversationMessages,
  listMyConversations
};
