/**
 * Prompt Templates for Code Generation
 * 
 * Uses a 4-section architecture:
 * SYSTEM → CONTEXT → INSTRUCTION → FEW-SHOT
 */

/**
 * Build the system prompt for code generation
 * @param {string} language - Programming language
 * @returns {string} System prompt
 */
function buildGenerationSystemPrompt(language) {
  return `You are an expert ${language} developer and code generator.

RULES:
- Return ONLY code inside a single code block. No prose before or after.
- Follow ${language} best practices, idioms, and standard library conventions.
- Use meaningful variable and function names.
- Add brief inline comments for complex logic.
- Match the naming conventions and style from the provided file context.
- If the request is ambiguous, write the most commonly expected implementation.
- Never include import statements unless they are necessary for the code to run.

OUTPUT FORMAT:
\`\`\`${language}
// your generated code here
\`\`\``;
}

/**
 * Build the full prompt for code generation
 * @param {Object} params
 * @param {string} params.prompt - User's natural language request
 * @param {string} params.fileContent - Current file content for context
 * @param {string} params.language - Programming language
 * @param {number} params.cursorLine - Current cursor line number
 * @returns {Array} Messages array for OpenAI API
 */
function buildGenerationPrompt({ prompt, fileContent, language, cursorLine }) {
  const messages = [
    {
      role: 'system',
      content: buildGenerationSystemPrompt(language),
    },
  ];

  // CONTEXT SECTION — inject file content (last 150 lines)
  if (fileContent && fileContent.trim()) {
    const lines = fileContent.split('\n');
    const contextLines = lines.slice(Math.max(0, lines.length - 150));
    messages.push({
      role: 'user',
      content: `<file_context language="${language}" cursor_line="${cursorLine}">
${contextLines.join('\n')}
</file_context>

This is the current file I'm working on. Use it as context for the code you generate.`,
    });
    messages.push({
      role: 'assistant',
      content: 'I understand the file context. I will generate code that integrates with the existing code style and structure. What would you like me to generate?',
    });
  }

  // INSTRUCTION SECTION — the actual user request
  messages.push({
    role: 'user',
    content: prompt,
  });

  return messages;
}

module.exports = { buildGenerationPrompt, buildGenerationSystemPrompt };
