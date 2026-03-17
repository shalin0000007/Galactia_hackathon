/**
 * Research Agent — The analyst
 *
 * Handles research tasks: market analysis, data collection,
 * comparing options, gathering information.
 * 
 * Merged: Person A (Groq + LangChain) + Person B (task detection + structured JSON)
 */

const { ChatGroq } = require('@langchain/groq');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const config = require('../config');

const RESEARCH_SYSTEM_PROMPT = `You are the Research Agent in the AgentPay system.
Your job is to analyze cryptocurrency markets and collect financial data.

IMPORTANT — always return your answer as valid JSON with this structure:

{
  "status": "completed",
  "taskType": "analyze_market" | "collect_data",
  "summary": "Brief one-line summary of findings",
  "findings": {
    "top_picks": [
      {
        "name": "Asset name",
        "symbol": "Ticker",
        "analysis": "Your analysis",
        "score": 8,
        "metrics": { "price": "$3400", "change_24h": "+2.3%" }
      }
    ],
    "analysis": "Overall analysis paragraph",
    "confidence": 0.85
  },
  "recommendation": "Your overall recommendation",
  "sources": ["Simulated data sources used"]
}

Be thorough and specific. Provide realistic, well-reasoned analysis.
Always return ONLY the JSON object, no other text or markdown.`;

class ResearchAgent {
  constructor() {
    this.name = 'Research Agent';
    this.role = 'research';
    this.capabilities = ['analyze_market', 'collect_data'];
    this.model = new ChatGroq({
      model: 'llama-3.3-70b-versatile',
      temperature: config.ai.research.temperature,
      maxTokens: config.ai.research.maxTokens,
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  /**
   * Perform a research task
   * @param {string} taskDescription - What to research
   * @returns {Object} { status, research_type, findings, summary }
   */
  async research(taskDescription) {
    const startTime = Date.now();
    const taskType = this._detectTaskType(taskDescription);

    try {
      const enrichedPrompt = `[Task Type: ${taskType}]\n\n${taskDescription}`;

      const response = await this.model.invoke([
        new SystemMessage(RESEARCH_SYSTEM_PROMPT),
        new HumanMessage(`Research this: ${enrichedPrompt}`),
      ]);

      const content = response.content.trim();

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      return {
        agent: 'research',
        status: parsed.status || 'completed',
        research_type: parsed.taskType || taskType,
        findings: parsed.findings || {},
        summary: parsed.summary || 'Research completed',
        recommendation: parsed.recommendation || null,
        confidence: parsed.findings?.confidence || null,
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`[ResearchAgent] Error: ${error.message}`);
      return {
        agent: 'research',
        status: 'failed',
        research_type: 'error',
        findings: { error: error.message },
        summary: `Research failed: ${error.message}`,
        duration_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Infer the task type from the description keywords (Person B logic).
   * @param {string} description
   * @returns {'analyze_market'|'collect_data'}
   */
  _detectTaskType(description) {
    const lower = description.toLowerCase();
    if (
      lower.includes('analyze') ||
      lower.includes('analysis') ||
      lower.includes('compare') ||
      lower.includes('evaluate') ||
      lower.includes('best')
    ) {
      return 'analyze_market';
    }
    return 'collect_data';
  }
}

module.exports = { ResearchAgent };
