const express = require('express');
const Joi = require('joi');
const aiService = require('../services/aiService');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * POST /api/v1/analyze
 * Detect bugs in code
 */
const analyzeSchema = Joi.object({
  file_content: Joi.string().min(1).max(50000).required(),
  language: Joi.string().valid(
    'python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'
  ).required(),
  file_id: Joi.string().default('unknown'),
});

router.post('/analyze', aiRateLimiter, async (req, res) => {
  try {
    const { error, value } = analyzeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: error.details[0].message,
          status: 400,
        },
      });
    }

    const { file_content, language, file_id } = value;

    const result = await aiService.detectBugs({
      fileContent: file_content,
      language,
      fileId: file_id,
    });

    res.json({
      bugs: result.bugs,
      scan_time_ms: result.scanTimeMs,
      total_issues: result.totalIssues,
    });
  } catch (err) {
    console.error('[Analyze] Error:', err.message);
    res.status(500).json({
      error: {
        code: 'ANALYSIS_FAILED',
        message: 'Bug analysis failed. Please try again.',
        status: 500,
      },
    });
  }
});

/**
 * POST /api/v1/fix
 * Auto-fix a specific bug
 */
const fixSchema = Joi.object({
  bug_id: Joi.string().required(),
  file_content: Joi.string().min(1).max(50000).required(),
  language: Joi.string().valid(
    'python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'
  ).required(),
  bug_description: Joi.string().max(1000).default(''),
});

router.post('/fix', aiRateLimiter, async (req, res) => {
  try {
    const { error, value } = fixSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: error.details[0].message,
          status: 400,
        },
      });
    }

    const { bug_id, file_content, language, bug_description } = value;

    const result = await aiService.fixBug({
      bugId: bug_id,
      fileContent: file_content,
      language,
      bugDescription: bug_description,
    });

    res.json({
      fixed_code: result.fixedCode,
      explanation: result.explanation,
      tokens_used: result.tokensUsed,
    });
  } catch (err) {
    console.error('[Fix] Error:', err.message);
    res.status(500).json({
      error: {
        code: 'FIX_FAILED',
        message: 'Bug fix failed. Please try again.',
        status: 500,
      },
    });
  }
});

module.exports = router;
