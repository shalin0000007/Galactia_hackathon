/**
 * researchAgent.js — Research Agent
 *
 * Day 2 (Person B): Handles 'analyze_market' and 'collect_data' tasks.
 * Returns structured JSON with research findings.
 */

const AgentBase = require('./agentBase');

const RESEARCH_SYSTEM_PROMPT = `You are the Research Agent in the AgentPay system.
Your job is to analyze cryptocurrency markets and collect financial data.

IMPORTANT — always return your answer as valid JSON with this structure:

{
  "taskType": "analyze_market" | "collect_data",
  "summary": "Brief one-line summary of findings",
  "data": [
    {
      "name": "Asset or data-point name",
      "symbol": "Ticker symbol if applicable",
      "analysis": "Your analysis or collected data",
      "score": 1-10 (confidence / relevance score),
      "metrics": { "key": "value pairs of relevant metrics" }
    }
  ],
  "recommendation": "Your overall recommendation based on the analysis",
  "confidence": 1-10,
  "sources": ["Simulated data sources used"]
}

Be thorough and specific. Provide realistic, well-reasoned analysis even though this is a simulated environment. Always return ONLY the JSON object, no other text.`;

class ResearchAgent extends AgentBase {
  constructor() {
    super({
      name: 'Research Agent',
      role: 'research',
      capabilities: ['analyze_market', 'collect_data'],
      systemPrompt: RESEARCH_SYSTEM_PROMPT,
    });
  }

  /**
   * Execute a research task.
   * Enriches the base result with research-specific metadata.
   *
   * @param {string} taskDescription — Plain-text description of the research task
   * @returns {Promise<Object>}
   */
  async execute(taskDescription) {
    // Detect the task type from the description
    const taskType = this._detectTaskType(taskDescription);

    // Prepend a machine-readable hint so the LLM knows which schema to follow
    const enrichedPrompt = `[Task Type: ${taskType}]\n\n${taskDescription}`;

    const result = await super.execute(enrichedPrompt);

    // Attach the detected task type for downstream consumption
    result.taskType = taskType;

    return result;
  }

  // ----------------------------------------------------------------
  //  Internal helpers
  // ----------------------------------------------------------------

  /**
   * Infer the task type from the description keywords.
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

module.exports = ResearchAgent;
