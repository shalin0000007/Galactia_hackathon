/**
 * Execution Agent — The doer
 * 
 * Handles execution tasks: execute trades, make transactions,
 * take actions based on research results.
 * Now equipped with live Sonic network telemetry via Ethers.js tools.
 */

const { ChatGroq } = require('@langchain/groq');
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage, ToolMessage } = require('@langchain/core/messages');
const config = require('../config');

// Import the execution tools
const { sonicGasTool } = require('./tools/sonicGasTool');
const { bridgeTool } = require('./tools/bridgeTool');

const EXECUTION_SYSTEM_PROMPT = `You are the Execution Agent in AgentPay — an autonomous multi-agent payment system operating on the Sonic blockchain.

Your job:
1. Receive an execution task (e.g., execute a trade, send a payment, take an on-chain action)
2. Use your tools to check the live network status (gas fees, block number)
3. Analyze the task and plan the execution using the real network data
4. Return a structured result describing the action you took/planned.

Context:
- You operate on the Sonic network (EVM Layer-1, Chain ID 146)
- Payments are settled in USDT (ERC20) via Tether WDK wallets
- All transactions produce real, verifiable tx hashes on sonicscan.org

Rules:
- Always return valid JSON (no markdown, no code blocks)
- Use real network data fetched from your tools in your response (like current block or gas price)
- Include a brief summary of what was done

Response format:
{
  "status": "completed",
  "action": "execute_trade",
  "details": {
    "asset": "ETH",
    "amount": 0.1,
    "network_block": 1234567,
    "estimated_gas_gwei": "25.4",
    "network": "Sonic"
  },
  "summary": "Planned buy order for 0.1 ETH at block 1234567 with 25.4 gwei gas on Sonic."
}`;

class ExecutionAgent {
  constructor() {
    this.name = 'Execution Agent';
    this.role = 'execution';
    this.tools = [sonicGasTool, bridgeTool];

    if (config.aiProvider === 'openai') {
      this.model = new ChatOpenAI({
        modelName: 'gpt-4o',
        temperature: config.ai.execution.temperature,
        maxTokens: config.ai.execution.maxTokens,
        openAIApiKey: config.openaiApiKey,
      });
    } else {
      this.model = new ChatGroq({
        model: 'llama-3.3-70b-versatile',
        temperature: config.ai.execution.temperature,
        maxTokens: config.ai.execution.maxTokens,
        apiKey: process.env.GROQ_API_KEY,
      });
    }
  }

  /**
   * Execute a task with live tool support
   * @param {string} taskDescription - What to execute
   * @returns {Object} { status, action, details, summary }
   */
  async executeTask(taskDescription) {
    const startTime = Date.now();

    try {
      console.log(`[ExecutionAgent] Starting tool-enabled execution: "${taskDescription}"`);
      
      const modelWithTools = this.model.bindTools(this.tools);
      
      const initialMessages = [
        new SystemMessage(EXECUTION_SYSTEM_PROMPT),
        new HumanMessage(`Execute this task: ${taskDescription}`),
      ];

      console.log(`[ExecutionAgent] Invoking LLM for execution planning...`);
      const response = await modelWithTools.invoke(initialMessages);
      
      let finalContent = response.content;

      // Handle tool calls
      if (response.tool_calls && response.tool_calls.length > 0) {
        console.log(`[ExecutionAgent] LLM triggered ${response.tool_calls.length} tool calls.`);
        
        const toolMessages = [];
        const toolsByName = Object.fromEntries(this.tools.map(t => [t.name, t]));
        
        for (const toolCall of response.tool_calls) {
          const toolName = toolCall.name;
          const toolArgs = toolCall.args;
          const toolInstance = toolsByName[toolName];
          
          if (toolInstance) {
            console.log(`[ExecutionAgent] Calling tool: ${toolName}`);
            const toolResult = await toolInstance.invoke(toolArgs);
            toolMessages.push(new ToolMessage({
              tool_call_id: toolCall.id,
              name: toolName,
              content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
            }));
          }
        }

        console.log(`[ExecutionAgent] Sending tool results back for final JSON generation...`);
        const finalResponse = await this.model.invoke([
          ...initialMessages,
          response,
          ...toolMessages
        ]);
        
        finalContent = finalResponse.content;
      } else {
        console.log(`[ExecutionAgent] No tools called for execution plan.`);
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
        agent: 'execution',
        status: parsed.status || 'completed',
        action: parsed.action || 'unknown',
        details: parsed.details || {},
        summary: parsed.summary || 'Task executed with simulated metrics',
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`[ExecutionAgent] Error: ${error.message}`);
      return {
        agent: 'execution',
        status: 'failed',
        action: 'error',
        details: { error: error.message },
        summary: `Execution failed: ${error.message}`,
        duration_ms: Date.now() - startTime,
      };
    }
  }
}

module.exports = { ExecutionAgent };
