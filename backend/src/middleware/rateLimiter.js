const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * AI Request Rate Limiter
 * 10 AI requests per minute per user (based on IP in dev mode)
 */
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.rateLimits.aiRequestsPerMinute,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `You have exceeded ${config.rateLimits.aiRequestsPerMinute} AI requests per minute`,
      status: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

/**
 * Standard Request Rate Limiter
 * 60 requests per minute per user
 */
const standardRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.rateLimits.standardRequestsPerMinute,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `You have exceeded ${config.rateLimits.standardRequestsPerMinute} requests per minute`,
      status: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

module.exports = { aiRateLimiter, standardRateLimiter };
