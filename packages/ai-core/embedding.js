const { OpenAI } = require("openai");

const DEFAULT_MODEL = "text-embedding-3-small";
const EXPECTED_DIMENSIONS = 1536;

/**
 * Generate deterministic pseudo-embedding vector when API key is not present.
 */
/**
 * Generate deterministic token and character n-gram feature vector when API key is not present.
 * Uses Bag-of-Words + Subword 3-grams with L2 normalization for precise cosine similarity.
 */
const generateDeterministicEmbedding = (text) => {
  const vector = new Array(EXPECTED_DIMENSIONS).fill(0);
  if (!text || typeof text !== "string") return vector;

  // Clean text and split into normalized tokens
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = normalized.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) return vector;

  for (const word of words) {
    // Word level hash
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const primaryIdx = Math.abs(hash) % EXPECTED_DIMENSIONS;
    vector[primaryIdx] += 1.0;

    // Subword 3-grams for partial/typo matching
    if (word.length >= 3) {
      for (let i = 0; i <= word.length - 3; i++) {
        const ngram = word.substring(i, i + 3);
        let nHash = 0;
        for (let j = 0; j < ngram.length; j++) {
          nHash = (nHash << 5) - nHash + ngram.charCodeAt(j);
          nHash |= 0;
        }
        const ngramIdx = Math.abs(nHash) % EXPECTED_DIMENSIONS;
        vector[ngramIdx] += 0.3;
      }
    }
  }

  // L2 normalize vector for cosine similarity
  let norm = 0;
  for (let i = 0; i < EXPECTED_DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < EXPECTED_DIMENSIONS; i++) {
      vector[i] = parseFloat((vector[i] / norm).toFixed(6));
    }
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

  let client = null;
  let model = process.env.EMBEDDING_MODEL || "openai/text-embedding-3-small";

  if (openrouterKey) {
    client = new OpenAI({
      apiKey: openrouterKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://remat.id",
        "X-Title": "ReMat Platform"
      }
    });
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
