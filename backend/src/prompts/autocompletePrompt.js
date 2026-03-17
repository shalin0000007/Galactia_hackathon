/**
 * Prompt Templates for Auto-complete
 * 
 * Lower temperature (0.3) for consistent, predictable completions.
 * Max 400 tokens to keep suggestions focused.
 */

/**
 * Build the system prompt for autocomplete
 * @param {string} language - Programming language
 * @returns {string} System prompt
 */
function buildAutocompleteSystemPrompt(language) {
  return `You are an intelligent ${language} code completion engine.

RULES:
- Complete the code naturally based on the context and partial code.
- Return ONLY the completion text — no explanation, no code block markers.
- Suggest up to 5 lines of meaningful code, not just single tokens.
- Follow the naming conventions already present in the file.
- If the partial code is a function signature, complete the entire function body.
- If the partial code is a variable assignment, complete the value.
- Do NOT repeat the partial code — only return what comes after it.
- Match indentation and style of the surrounding code.`;
}

/**
 * Build the full prompt for autocomplete
 * @param {Object} params
 * @param {string} params.partialCode - Code being typed
 * @param {string} params.fileContext - Surrounding file content
 * @param {string} params.language - Programming language
 * @param {Object} params.cursorPosition - { line, column }
 * @returns {Array} Messages array for OpenAI API
 */
function buildAutocompletePrompt({ partialCode, fileContext, language, cursorPosition }) {
  const messages = [
    {
      role: 'system',
      content: buildAutocompleteSystemPrompt(language),
    },
  ];

  if (fileContext && fileContext.trim()) {
    const lines = fileContext.split('\n');
    const contextLines = lines.slice(Math.max(0, lines.length - 50));
    messages.push({
      role: 'user',
      content: `<file_context language="${language}">
${contextLines.join('\n')}
</file_context>

Complete the following partial code at line ${cursorPosition?.line || 'unknown'}, column ${cursorPosition?.column || 'unknown'}:

${partialCode}`,
    });
  } else {
    messages.push({
      role: 'user',
      content: `Complete the following ${language} code:\n\n${partialCode}`,
    });
  }

  return messages;
}

module.exports = { buildAutocompletePrompt, buildAutocompleteSystemPrompt };
