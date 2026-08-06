const { OpenAI } = require("openai");

const DEFAULT_MODEL = "text-embedding-3-small";
const EXPECTED_DIMENSIONS = 1536;

/**
 * Generate deterministic pseudo-embedding vector when API key is not present.
 */
const generateDeterministicEmbedding = (text) => {
  const vector = new Array(EXPECTED_DIMENSIONS).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < EXPECTED_DIMENSIONS; i++) {
    const val = Math.sin(hash + i) * 10000;
    vector[i] = parseFloat((val - Math.floor(val)).toFixed(4));
  }
  return vector;
};

/**
 * Generate an embedding vector for the given text.
 * Supports OpenRouter, OpenAI, or gratis fallback embedding.
 *
 * @param {string} text - The text to embed.
 * @returns {Promise<{ embedding: number[], model: string }>}
 */
const generateEmbedding = async (text) => {
  if (global.generateEmbeddingMock) {
    return global.generateEmbeddingMock(text);
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("[ai-core] Cannot generate embedding for empty text.");
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  let client = null;
  let model = process.env.EMBEDDING_MODEL || DEFAULT_MODEL;

  if (openrouterKey) {
    client = new OpenAI({
      apiKey: openrouterKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://remat.id",
        "X-Title": "ReMat Platform"
      }
    });
    if (!process.env.EMBEDDING_MODEL) {
      model = "openai/text-embedding-3-small";
    }
  } else if (openaiKey) {
    client = new OpenAI({ apiKey: openaiKey });
  }

  if (!client) {
    // Fallback gratis tanpa butuh API key (bebas biaya)
    return {
      embedding: generateDeterministicEmbedding(text),
      model: "fallback-hash-embedding"
    };
  }

  try {
    const response = await client.embeddings.create({
      model,
      input: text.trim()
    });

    const embedding = response.data[0].embedding;

    return {
      embedding,
      model
    };
  } catch (err) {
    console.warn(`[ai-core] Embedding API error (${err.message}). Using fallback vector.`);
    return {
      embedding: generateDeterministicEmbedding(text),
      model: "fallback-hash-embedding"
    };
  }
};

/**
 * Check if embedding service is available.
 */
const isAvailable = () => {
  if (global.isEmbeddingAvailableMock !== undefined) {
    return global.isEmbeddingAvailableMock;
  }
  return true;
};

module.exports = {
  generateEmbedding,
  isAvailable,
  EXPECTED_DIMENSIONS,
  DEFAULT_MODEL
};
