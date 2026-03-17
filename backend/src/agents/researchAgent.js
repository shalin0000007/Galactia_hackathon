/**
 * Research Agent — The analyst
 * 
 * Handles research tasks: market analysis, data collection,
 * comparing options, gathering information.
 * 
 * Note: Person B may replace this with their own implementation.
 * This is Person A's default so the chain works end-to-end.
 */

const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const config = require('../config');

const RESEARCH_SYSTEM_PROMPT = `You are the Research Agent in AgentPay — an AI-powered autonomous payment system.

Your job:
1. Receive a research task (e.g., analyze market, collect data, compare options)
2. Perform thorough analysis with realistic data
3. Return structured findings

You handle:
- analyze_market: Analyze cryptocurrency or financial market trends
- collect_data: Gather and organize data on a topic
- compare_options: Compare multiple options with pros/cons

Rules:
- Always return valid JSON (no markdown, no code blocks)
- Include realistic mock data (prices, percentages, rankings)
- Be thorough but concise
- Include confidence scores and data sources

Response format:
{
  "status": "completed",
  "research_type": "analyze_market",
  "findings": {
    "top_picks": [
      { "name": "Ethereum", "symbol": "ETH", "price": 3450.25, "change_24h": "+2.3%", "recommendation": "buy" }
    ],
    "analysis": "Based on market trends...",
    "confidence": 0.82
  },
  "summary": "Analyzed top 5 cryptocurrencies. ETH shows strongest momentum."
}`;

class ResearchAgent {
  constructor() {
    this.name = 'Research Agent';
    this.model = new ChatOpenAI({
      modelName: config.ai.research.model,
      temperature: config.ai.research.temperature,
      maxTokens: config.ai.research.maxTokens,
      openAIApiKey: config.openaiApiKey,
    });
  }

  /**
   * Perform a research task
   * @param {string} taskDescription - What to research
   * @returns {Object} { status, research_type, findings, summary }
   */
  async research(taskDescription) {
    const startTime = Date.now();

    try {
      const response = await this.model.invoke([
        new SystemMessage(RESEARCH_SYSTEM_PROMPT),
        new HumanMessage(`Research this: ${taskDescription}`),
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
        research_type: parsed.research_type || 'general',
        findings: parsed.findings || {},
        summary: parsed.summary || 'Research completed',
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
}

module.exports = { ResearchAgent };
