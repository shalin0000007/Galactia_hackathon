/**
 * Research Agent — The analyst
 *
 * Handles research tasks: market analysis, data collection,
 * comparing options, gathering information.
 * 
 * Now enhanced with real API tool-use using native tool binding.
 */

const { ChatGroq } = require('@langchain/groq');
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage, ToolMessage } = require('@langchain/core/messages');
const config = require('../config');

// Import the tools
const { cryptoPriceTool } = require('./tools/cryptoPriceTool');
const { defiYieldTool } = require('./tools/defiYieldTool');
const { aaveLendingTool } = require('./tools/aaveLendingTool');
const { bridgeTool } = require('./tools/bridgeTool');

const RESEARCH_SYSTEM_PROMPT = `You are the Research Agent in AgentPay — an autonomous multi-agent system operating on the Sonic blockchain (EVM Layer-1, Chain ID 146).
Your job is to analyze cryptocurrency markets and collect live financial data using your tools to inform decisions.

IMPORTANT — always return your final answer as valid JSON with this structure:

{
  "status": "completed",
  "taskType": "analyze_market" | "collect_data",
  "summary": "Brief one-line summary of findings",
  "findings": {
    "top_picks": [
      {
        "name": "Asset name",
        "symbol": "Ticker",
        "analysis": "Your analysis based on real data fetched from tools",
        "score": 8,
        "metrics": { "price": "$3400", "change_24h": "+2.3%" }
      }
    ],
    "analysis": "Overall analysis paragraph based on actual data you fetched",
    "confidence": 0.85
  },
  "recommendation": "Your overall recommendation based on live data",
  "sources": ["Data sources referenced (e.g., CoinGecko, DefiLlama)"]
}

Context: You are paid 0.5 USDT per task via Tether WDK on Sonic. Focus on actionable, data-driven insights.
You have access to live API tools (CoinGecko and DefiLlama). Use them to get real data before answering!
Always return ONLY the JSON object, no other text or markdown after your research is complete.`;

class ResearchAgent {
  constructor() {
    this.name = 'Research Agent';
    this.role = 'research';
    this.capabilities = ['analyze_market', 'collect_data'];
    this.tools = [cryptoPriceTool, defiYieldTool, aaveLendingTool, bridgeTool];

    if (config.aiProvider === 'openai') {
      this.model = new ChatOpenAI({
        modelName: 'gpt-4o',
        temperature: config.ai.research.temperature,
        maxTokens: config.ai.research.maxTokens,
        openAIApiKey: config.openaiApiKey,
      });
    } else {
      this.model = new ChatGroq({
        model: 'llama-3.3-70b-versatile',
        temperature: config.ai.research.temperature,
        maxTokens: config.ai.research.maxTokens,
        apiKey: process.env.GROQ_API_KEY,
      });
    }
  }

  /**
   * Perform a research task using live tools
   * @param {string} taskDescription - What to research
   * @returns {Object} { status, research_type, findings, summary }
   */
  async research(taskDescription) {
    const startTime = Date.now();
    const taskType = this._detectTaskType(taskDescription);

    try {
      console.log(`[ResearchAgent] Starting tool-enabled research: "${taskDescription}"`);
      
      const modelWithTools = this.model.bindTools(this.tools);
      
      const initialMessages = [
        new SystemMessage(RESEARCH_SYSTEM_PROMPT),
        new HumanMessage(`Research this: [Task Type: ${taskType}]\n\n${taskDescription}`),
      ];

      console.log(`[ResearchAgent] Invoking LLM for tool decision...`);
      const response = await modelWithTools.invoke(initialMessages);
      
      let finalContent = response.content;

      // Check if the LLM decided to call any tools
      if (response.tool_calls && response.tool_calls.length > 0) {
        console.log(`[ResearchAgent] LLM triggered ${response.tool_calls.length} tool calls.`);
        
        const toolMessages = [];
        const toolsByName = Object.fromEntries(this.tools.map(t => [t.name, t]));
        
        for (const toolCall of response.tool_calls) {
          const toolName = toolCall.name;
          const toolArgs = toolCall.args;
          const toolInstance = toolsByName[toolName];
          
          if (toolInstance) {
            console.log(`[ResearchAgent] Calling tool: ${toolName} with args:`, toolArgs);
            const toolResult = await toolInstance.invoke(toolArgs);
            toolMessages.push(new ToolMessage({
              tool_call_id: toolCall.id,
              name: toolName,
              content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
            }));
          }
        }

        console.log(`[ResearchAgent] Sending tool results back for final JSON generation...`);
        const finalResponse = await this.model.invoke([
          ...initialMessages,
          response, // The original AIMessage containing the tool_calls
          ...toolMessages
        ]);
        
        finalContent = finalResponse.content;
      } else {
        console.log(`[ResearchAgent] No tools called. Generated direct response.`);
      }

      const content = finalContent.trim();

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

module.exports = { ResearchAgent };
