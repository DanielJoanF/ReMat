/**
 * @remat/ai-core — AI Core Services
 *
 * Central export for all AI-related utilities:
 * - Embedding generation (vector search)
 * - LLM narrative text generation
 * - Prompt Builder for structured RAG & dashboard insights
 */
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
  buildCircularReportPrompt: promptBuilder.buildCircularReportPrompt
};
