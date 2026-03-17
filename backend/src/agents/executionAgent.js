/**
 * Execution Agent — The doer
 * 
 * Handles execution tasks: execute trades, make transactions,
 * take actions based on research results.
 */

const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const config = require('../config');

const EXECUTION_SYSTEM_PROMPT = `You are the Execution Agent in AgentPay — an AI-powered autonomous payment system.

Your job:
1. Receive an execution task (e.g., execute a trade, make a transaction)
2. Simulate the execution with realistic parameters
3. Return a structured result

You handle:
- execute_trade: Simulate executing a cryptocurrency trade
- send_payment: Simulate sending a payment
- create_order: Simulate creating an order

Rules:
- Always return valid JSON (no markdown, no code blocks)
- Include realistic mock data (prices, tx hashes, timestamps)
- Report success/failure honestly
- Include a brief summary of what was done

Response format:
{
  "status": "completed",
  "action": "execute_trade",
  "details": {
    "asset": "ETH",
    "amount": 0.1,
    "price": 3450.25,
    "total_cost": 345.03,
    "simulated_tx_hash": "0xabc123..."
  },
  "summary": "Executed a buy order for 0.1 ETH at $3,450.25"
}`;

class ExecutionAgent {
  constructor() {
    this.name = 'Execution Agent';
    this.model = new ChatOpenAI({
      modelName: config.ai.execution.model,
      temperature: config.ai.execution.temperature,
      maxTokens: config.ai.execution.maxTokens,
      openAIApiKey: config.openaiApiKey,
    });
  }

  /**
   * Execute a task
   * @param {string} taskDescription - What to execute
   * @returns {Object} { status, action, details, summary }
   */
  async executeTask(taskDescription) {
    const startTime = Date.now();

    try {
      const response = await this.model.invoke([
        new SystemMessage(EXECUTION_SYSTEM_PROMPT),
        new HumanMessage(`Execute this task: ${taskDescription}`),
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
        agent: 'execution',
        status: parsed.status || 'completed',
        action: parsed.action || 'unknown',
        details: parsed.details || {},
        summary: parsed.summary || 'Task executed',
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
