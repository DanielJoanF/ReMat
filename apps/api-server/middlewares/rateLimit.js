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
  // Rate limit hanya aktif di produksi — di dev/test tidak perlu (agar nyaman ngembang)
  skip: () => process.env.NODE_ENV !== "production"
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
  // Rate limit hanya aktif di produksi — di dev/test tidak perlu
  skip: () => process.env.NODE_ENV !== "production"
});

module.exports = {
  apiLimiter,
  aiLimiter
};