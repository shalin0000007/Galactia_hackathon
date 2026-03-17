const express = require('express');
const Joi = require('joi');
const aiService = require('../services/aiService');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * POST /api/v1/autocomplete
 * Get AI-powered code completions
 */

const autocompleteSchema = Joi.object({
  partial_code: Joi.string().min(1).max(5000).required(),
  file_context: Joi.string().max(20000).default(''),
  language: Joi.string().valid(
    'python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'
  ).default('python'),
  cursor_position: Joi.object({
    line: Joi.number().integer().min(0).required(),
    column: Joi.number().integer().min(0).required(),
  }).default({ line: 0, column: 0 }),
});

router.post('/', aiRateLimiter, async (req, res) => {
  try {
    const { error, value } = autocompleteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: error.details[0].message,
          status: 400,
        },
      });
    }

    const { partial_code, file_context, language, cursor_position } = value;

    const result = await aiService.getAutoComplete({
      partialCode: partial_code,
      fileContext: file_context,
      language,
      cursorPosition: cursor_position,
    });

    res.json({
      suggestion: result.suggestion,
      confidence: result.confidence,
      cached: result.cached,
    });
  } catch (err) {
    console.error('[Autocomplete] Error:', err.message);
    res.status(500).json({
      error: {
        code: 'AUTOCOMPLETE_FAILED',
        message: 'Autocomplete failed. Please try again.',
        status: 500,
      },
    });
  }
});

module.exports = router;
