const rateLimit = require("express-rate-limit");

/**
 * General API Rate Limiter
 * 100 requests per 15 minutes window for standard endpoints.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Terlalu banyak permintaan dari IP ini. Silakan coba lagi setelah 15 menit.",
      statusCode: 429
    }
  },
  skip: () => process.env.NODE_ENV === "test" // Disable in unit/integration test env
});

/**
 * Strict Limiter for AI endpoints (/search, /chat) to prevent API abuse.
 * 30 requests per 15 minutes window.
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Batas permintaan layanan AI terlampaui. Silakan coba beberapa saat lagi.",
      statusCode: 429
    }
  },
  skip: () => process.env.NODE_ENV === "test" // Disable in test env
});

module.exports = {
  apiLimiter,
  aiLimiter
};
