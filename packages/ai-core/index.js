const embedding = require("./embedding");
const llm = require("./llm");
const promptBuilder = require("./promptBuilder");

module.exports = {
  embedding,
  generateEmbedding: embedding.generateEmbedding,
  isEmbeddingAvailable: embedding.isAvailable,

  llm,
  generateText: llm.generateText,
  isLlmAvailable: llm.isLlmAvailable,

  promptBuilder,
  buildDashboardInsightPrompt: promptBuilder.buildDashboardInsightPrompt,
  buildCircularReportPrompt: promptBuilder.buildCircularReportPrompt,
  buildChatbotPrompt: promptBuilder.buildChatbotPrompt
};
