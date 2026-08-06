const { OpenAI } = require("openai");

const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.0-flash-exp:free";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 15000; // 15s timeout

const getLlmClient = () => {
  const groqKey = process.env.GROQ_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Primary: Groq API
  if (groqKey) {
    return {
      client: new OpenAI({
        apiKey: groqKey,
        baseURL: "https://api.groq.com/openai/v1"
      }),
      model: process.env.LLM_MODEL || DEFAULT_GROQ_MODEL
    };
  }

  // 2. Fallback: OpenRouter API
  if (openrouterKey) {
    return {
      client: new OpenAI({
        apiKey: openrouterKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://remat.id",
          "X-Title": "ReMat Platform"
        }
      }),
      model: process.env.LLM_MODEL || DEFAULT_OPENROUTER_MODEL
    };
  }

  // 3. Fallback: OpenAI API
  if (openaiKey) {
    return {
      client: new OpenAI({ apiKey: openaiKey }),
      model: process.env.LLM_MODEL || DEFAULT_OPENAI_MODEL
    };
  }

  throw new Error("[ai-core] Neither GROQ_API_KEY, OPENROUTER_API_KEY, nor OPENAI_API_KEY environment variable is set.");
};

/**
 * Generate narrative response from system & user prompt.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<string>}
 */
const generateText = async (systemPrompt, userPrompt) => {
  // Test mock hook for deterministic testing
  if (global.generateTextMock) {
    return global.generateTextMock(systemPrompt, userPrompt);
  }

  const { client, model } = getLlmClient();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      },
      { signal: controller.signal }
    );

    return response.choices[0]?.message?.content || "";
  } finally {
    clearTimeout(timer);
  }
};

const isLlmAvailable = () => {
  if (global.isLlmAvailableMock !== undefined) {
    return global.isLlmAvailableMock;
  }
  return !!(process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
};

module.exports = {
  generateText,
  isLlmAvailable,
  DEFAULT_GROQ_MODEL,
  DEFAULT_OPENROUTER_MODEL,
  DEFAULT_OPENAI_MODEL
};
