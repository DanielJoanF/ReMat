/**
 * @remat/ai-core — Embedding Service
 *
 * Generates text embeddings using OpenAI's text-embedding API.
 * Supports text-embedding-3-small (1536 dims) matching SCHEMA.md vector(1536).
 *
 * Environment variables:
 *   OPENAI_API_KEY    — Required. OpenAI API key.
 *   EMBEDDING_MODEL   — Optional. Defaults to "text-embedding-3-small".
 */
const { OpenAI } = require("openai");

const DEFAULT_MODEL = "text-embedding-3-small";
const EXPECTED_DIMENSIONS = 1536;

const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[ai-core] OPENAI_API_KEY environment variable is not set. " +
      "Embedding generation will not work."
    );
  }

  return new OpenAI({ apiKey });
};

/**
 * Generate an embedding vector for the given text.
 *
 * @param {string} text - The text to embed.
 * @returns {Promise<{ embedding: number[], model: string }>}
 *   Object containing the embedding array and the model name used.
 * @throws {Error} If OPENAI_API_KEY is not set or API call fails.
 */
const generateEmbedding = async (text) => {
  if (global.generateEmbeddingMock) {
    return global.generateEmbeddingMock(text);
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("[ai-core] Cannot generate embedding for empty text.");
  }

  const openai = getClient();
  const model = process.env.EMBEDDING_MODEL || DEFAULT_MODEL;

  const response = await openai.embeddings.create({
    model,
    input: text.trim()
  });

  const embedding = response.data[0].embedding;

  if (!embedding || embedding.length !== EXPECTED_DIMENSIONS) {
    console.warn(
      `[ai-core] Expected ${EXPECTED_DIMENSIONS} dimensions, got ${embedding?.length}. ` +
      `Ensure model "${model}" produces ${EXPECTED_DIMENSIONS}-dim vectors.`
    );
  }

  return {
    embedding,
    model
  };
};

/**
 * Check if embedding service is available (API key is set or mock defined).
 */
const isAvailable = () => {
  if (global.isEmbeddingAvailableMock !== undefined) {
    return global.isEmbeddingAvailableMock;
  }
  return !!process.env.OPENAI_API_KEY;
};

module.exports = {
  generateEmbedding,
  isAvailable,
  EXPECTED_DIMENSIONS,
  DEFAULT_MODEL
};
