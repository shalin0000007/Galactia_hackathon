/**
 * Prompt Templates for Bug Detection & Auto-fix
 * 
 * Temperature: 0.2 (deterministic — bugs need consistent detection)
 * Max tokens: 600
 */

/**
 * Build the system prompt for bug detection
 * @param {string} language - Programming language
 * @returns {string} System prompt
 */
function buildBugDetectionSystemPrompt(language) {
  return `You are an expert ${language} code reviewer and bug detector.

TASK: Analyze the provided code and identify ALL bugs, issues, and potential problems.

CATEGORIES TO CHECK:
1. Logical errors (wrong conditions, off-by-one, infinite loops)
2. Null/undefined reference issues
3. Security vulnerabilities (SQL injection, XSS, unsanitised input)
4. Type errors and type mismatches
5. Resource leaks (unclosed files, connections, event listeners)
6. Performance issues (unnecessary loops, memory leaks)
7. Style violations and best practice deviations

OUTPUT FORMAT (strict JSON):
{
  "bugs": [
    {
      "line": <line_number>,
      "column": <column_number>,
      "severity": "critical" | "warning" | "info",
      "type": "<bug_type>",
      "description": "<clear explanation of the issue>",
      "suggested_fix": "<the corrected code snippet>"
    }
  ],
  "summary": "<1-sentence summary of overall code quality>"
}

If no bugs are found, return: { "bugs": [], "summary": "No issues detected." }
Return ONLY valid JSON. No markdown, no explanation outside JSON.`;
}

/**
 * Build the full prompt for bug detection
 */
function buildBugDetectionPrompt({ fileContent, language, fileId }) {
  return [
    {
      role: 'system',
      content: buildBugDetectionSystemPrompt(language),
    },
    {
      role: 'user',
      content: `<code language="${language}" file_id="${fileId || 'unknown'}">
${fileContent}
</code>

Analyze this code for bugs and issues.`,
    },
  ];
}

/**
 * Build prompt for auto-fixing a specific bug
 */
function buildBugFixPrompt({ bugId, fileContent, language, bugDescription }) {
  return [
    {
      role: 'system',
      content: `You are an expert ${language} developer. Fix the specified bug in the code.

RULES:
- Return the COMPLETE fixed file content in a code block
- Make minimal changes — only fix the identified bug
- Preserve all other code, comments, and formatting exactly
- Add a brief comment explaining the fix

OUTPUT FORMAT:
\`\`\`${language}
// fixed code here
\`\`\``,
    },
    {
      role: 'user',
      content: `<code language="${language}">
${fileContent}
</code>

Fix this bug: ${bugDescription}
Bug ID: ${bugId}`,
    },
  ];
}

module.exports = {
  buildBugDetectionPrompt,
  buildBugDetectionSystemPrompt,
  buildBugFixPrompt,
};
