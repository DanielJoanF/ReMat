/**
 * @remat/ai-core — LLM Service
 *
 * Orchestrates calls to LLM APIs (OpenAI GPT / Gemini) for narrative text generation.
 * Handles timeouts, fallback, and API key availability checks.
 *
 * Environment variables:
 *   OPENAI_API_KEY — OpenAI API key
 *   LLM_MODEL      — Optional, defaults to "gpt-4o-mini"
 */
const { OpenAI } = require("openai");

const DEFAULT_LLM_MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 10000; // 10s timeout

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("[ai-core] OPENAI_API_KEY environment variable is not set.");
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.LLM_MODEL || DEFAULT_LLM_MODEL;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await openai.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      { signal: controller.signal }
    );

    return response.choices[0]?.message?.content || "";
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Check if LLM service is configured and available.
 */
const isLlmAvailable = () => {
  if (global.isLlmAvailableMock !== undefined) {
    return global.isLlmAvailableMock;
  }
  return !!process.env.OPENAI_API_KEY;
};

module.exports = {
  generateText,
  isLlmAvailable,
  DEFAULT_LLM_MODEL
};
