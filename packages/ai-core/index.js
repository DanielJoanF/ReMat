/**
 * @remat/ai-core — AI Core Services
 *
 * Central export for all AI-related utilities:
 * - Embedding generation (vector search)
 * - (Future: Prompt Builder, LLM orchestration)
 */
const embedding = require("./embedding");

module.exports = {
  embedding,
  generateEmbedding: embedding.generateEmbedding,
  isEmbeddingAvailable: embedding.isAvailable
};
