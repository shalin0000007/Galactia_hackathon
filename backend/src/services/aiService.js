const OpenAI = require('openai');
const config = require('../config');
const { buildGenerationPrompt } = require('../prompts/generatePrompt');
const { buildAutocompletePrompt } = require('../prompts/autocompletePrompt');
const { buildBugDetectionPrompt, buildBugFixPrompt } = require('../prompts/bugDetectionPrompt');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * AI Service — Core AI Engine
 * Handles all interactions with the AI model (OpenAI/Claude)
 */
class AIService {
  /**
   * Generate code from a natural language prompt
   * @param {Object} params
   * @param {string} params.prompt - Natural language description
   * @param {string} params.fileContent - Current file content
   * @param {string} params.language - Programming language
   * @param {number} params.cursorLine - Cursor line number
   * @returns {Object} { code, explanation, language, tokensUsed }
   */
  async generateCode({ prompt, fileContent, language, cursorLine }) {
    const messages = buildGenerationPrompt({ prompt, fileContent, language, cursorLine });

    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: config.ai.generation.model,
      messages,
      temperature: config.ai.generation.temperature,
      max_tokens: config.ai.generation.maxTokens,
    });

    const responseTime = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;

    // Extract code from code block if present
    const code = this._extractCodeBlock(content, language);
    const explanation = this._extractExplanation(content);

    return {
      code,
      explanation,
      language,
      tokensUsed,
      responseTimeMs: responseTime,
      insertionPoint: { line: cursorLine || 0, column: 0 },
    };
  }

  /**
   * Get autocomplete suggestion
   * @param {Object} params
   * @param {string} params.partialCode - Partial code being typed
   * @param {string} params.fileContext - File context
   * @param {string} params.language - Language
   * @param {Object} params.cursorPosition - { line, column }
   * @returns {Object} { suggestion, confidence, cached }
   */
  async getAutoComplete({ partialCode, fileContext, language, cursorPosition }) {
    const messages = buildAutocompletePrompt({ partialCode, fileContext, language, cursorPosition });

    const response = await openai.chat.completions.create({
      model: config.ai.autocomplete.model,
      messages,
      temperature: config.ai.autocomplete.temperature,
      max_tokens: config.ai.autocomplete.maxTokens,
    });

    const suggestion = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;

    return {
      suggestion: suggestion.trim(),
      confidence: 0.85, // Placeholder — could be computed from logprobs
      cached: false,
      tokensUsed,
    };
  }

  /**
   * Detect bugs in code
   * @param {Object} params
   * @param {string} params.fileContent - Full file content
   * @param {string} params.language - Language
   * @param {string} params.fileId - File identifier
   * @returns {Object} { bugs, scanTimeMs, totalIssues }
   */
  async detectBugs({ fileContent, language, fileId }) {
    const messages = buildBugDetectionPrompt({ fileContent, language, fileId });

    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: config.ai.bugDetection.model,
      messages,
      temperature: config.ai.bugDetection.temperature,
      max_tokens: config.ai.bugDetection.maxTokens,
    });

    const scanTime = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '{}';

    try {
      const result = JSON.parse(content);
      return {
        bugs: result.bugs || [],
        scanTimeMs: scanTime,
        totalIssues: (result.bugs || []).length,
        summary: result.summary || '',
      };
    } catch (e) {
      // If AI doesn't return valid JSON, wrap the response
      return {
        bugs: [],
        scanTimeMs: scanTime,
        totalIssues: 0,
        summary: 'Bug scan completed but response could not be parsed.',
        rawResponse: content,
      };
    }
  }

  /**
   * Auto-fix a specific bug
   * @param {Object} params
   * @param {string} params.bugId - Bug identifier
   * @param {string} params.fileContent - Full file content
   * @param {string} params.language - Language
   * @param {string} params.bugDescription - Description of the bug
   * @returns {Object} { fixedCode, diff, explanation }
   */
  async fixBug({ bugId, fileContent, language, bugDescription }) {
    const messages = buildBugFixPrompt({ bugId, fileContent, language, bugDescription });

    const response = await openai.chat.completions.create({
      model: config.ai.bugDetection.model,
      messages,
      temperature: config.ai.bugDetection.temperature,
      max_tokens: config.ai.bugDetection.maxTokens,
    });

    const content = response.choices[0]?.message?.content || '';
    const fixedCode = this._extractCodeBlock(content, language);

    return {
      fixedCode,
      explanation: this._extractExplanation(content),
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  /**
   * Extract code from markdown code block
   */
  _extractCodeBlock(content, language) {
    // Match ```language ... ``` or ``` ... ```
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
    const match = content.match(codeBlockRegex);
    if (match) {
      return match[1].trim();
    }
    // If no code block found, return the raw content
    return content.trim();
  }

  /**
   * Extract explanation text (anything outside code blocks)
   */
  _extractExplanation(content) {
    const withoutCodeBlocks = content.replace(/```(?:\w+)?\n[\s\S]*?```/g, '').trim();
    return withoutCodeBlocks || '';
  }
}

module.exports = new AIService();
