const express = require('express');
const Joi = require('joi');
const aiService = require('../services/aiService');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * POST /api/v1/generate
 * Generate code from a natural language prompt
 */

// Request validation schema
const generateSchema = Joi.object({
  prompt: Joi.string().min(1).max(500).required(),
  file_content: Joi.string().max(50000).default(''),
  language: Joi.string().valid(
    'python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'
  ).default('python'),
  cursor_line: Joi.number().integer().min(0).default(0),
  max_tokens: Joi.number().integer().min(50).max(2000).default(800),
});

router.post('/', aiRateLimiter, async (req, res) => {
  try {
    // Validate request
    const { error, value } = generateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: error.details[0].message,
          status: 400,
        },
      });
    }

    const { prompt, file_content, language, cursor_line } = value;

    // Call AI service
    const result = await aiService.generateCode({
      prompt,
      fileContent: file_content,
      language,
      cursorLine: cursor_line,
    });

    // Return response
    res.json({
      code: result.code,
      explanation: result.explanation,
      language: result.language,
      tokens_used: result.tokensUsed,
      response_time_ms: result.responseTimeMs,
      insertion_point: result.insertionPoint,
    });
  } catch (err) {
    console.error('[Generate] Error:', err.message);

    if (err.status === 429) {
      return res.status(429).json({
        error: {
          code: 'AI_RATE_LIMITED',
          message: 'AI provider rate limit exceeded. Please try again shortly.',
          status: 429,
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'GENERATION_FAILED',
        message: 'Code generation failed. Please try again.',
        status: 500,
      },
    });
  }
});

module.exports = router;
