/**
 * Manager Agent — The orchestrator
 * 
 * Receives user prompts, breaks them into sub-tasks,
 * and assigns to Research or Execution agents.
 */

const { ChatGroq } = require('@langchain/groq');
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const config = require('../config');

const MANAGER_SYSTEM_PROMPT = `You are the Manager Agent in AgentPay — an autonomous multi-agent payment system operating on the Sonic blockchain (EVM Layer-1, Chain ID 146).

Your job:
1. Receive a user request
2. Break it into 1-3 sub-tasks
3. Assign each sub-task to the correct worker agent
4. Consider the cost of each task and optimize for budget efficiency

Available worker agents:
- "research": Research Agent — for data gathering, market analysis, comparing options, collecting information (costs 0.01 USDT per task)
- "execution": Execution Agent — for executing trades, making transactions, taking actions (costs 0.02 USDT per task)

Economic rules:
- Research tasks cost 0.01 USDT each, Execution tasks cost 0.02 USDT each
- Payments are settled in real USDT on the Sonic network via WDK wallets
- Minimize unnecessary tasks to conserve budget
- If a request can be handled by 1 task, don't split into 3
- Prefer research before execution (validate before acting)
- If the total estimated cost exceeds 0.05 USDT, add a "cost_warning" field

General rules:
- Always return valid JSON (no markdown, no code blocks)
- Each task must have: agent (research or execution), task (clear description), payment (0.01 for research, 0.02 for execution)
- Keep tasks focused and specific
- Maximum 3 sub-tasks per request
- If the request is unclear, create a research task to clarify first

Response format:
{
  "reasoning": "Brief explanation of how you broke down the request and cost considerations",
  "estimated_cost": 1.5,
  "tasks": [
    { "agent": "research", "task": "Analyze top 5 cryptocurrencies by market cap and recent performance", "payment": 0.01 },
    { "agent": "execution", "task": "Execute a small trade of 0.1 USDT in the top-performing crypto", "payment": 0.02 }
  ]
}`;

class ManagerAgent {
  constructor() {
    this.name = 'Manager Agent';
    if (config.aiProvider === 'openai') {
      this.model = new ChatOpenAI({
        modelName: 'gpt-4o',
        temperature: config.ai.manager.temperature,
        maxTokens: config.ai.manager.maxTokens,
        openAIApiKey: config.openaiApiKey,
      });
    } else {
      this.model = new ChatGroq({
        model: 'llama-3.3-70b-versatile',
        temperature: config.ai.manager.temperature,
        maxTokens: config.ai.manager.maxTokens,
        apiKey: process.env.GROQ_API_KEY,
      });
    }
  }

  /**
   * Process a user prompt and break it into sub-tasks
   * @param {string} prompt - User's request
   * @returns {Object} { reasoning, tasks: [{ agent, task, payment }] }
   */
  async processPrompt(prompt) {
    const startTime = Date.now();

    try {
      const response = await this.model.invoke([
        new SystemMessage(MANAGER_SYSTEM_PROMPT),
        new HumanMessage(prompt),
      ]);

      const content = response.content.trim();

      // Parse JSON response — handle potential markdown wrapping
      let parsed;
      try {
        // Try direct JSON parse first
        parsed = JSON.parse(content);
      } catch {
        // Strip markdown code blocks if present
        const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      // Validate structure
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error('Manager response missing tasks array');
      }

      for (const task of parsed.tasks) {
        if (!['research', 'execution'].includes(task.agent)) {
          throw new Error(`Invalid agent type: ${task.agent}`);
        }
        if (!task.task || typeof task.task !== 'string') {
          throw new Error('Each task must have a description string');
        }
        task.payment = task.agent === 'research' ? 0.5 : 1.0;
      }

      return {
        reasoning: parsed.reasoning || 'No reasoning provided',
        tasks: parsed.tasks,
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`[ManagerAgent] Error: ${error.message}`);
      throw new Error(`Manager Agent failed: ${error.message}`);
    }
  }

  /**
   * Evaluate the quality of a worker agent's result.
   * Used for quality-gated payment — low quality = reduced/no payment.
   * @param {Object} task — { agent, task }
   * @param {Object} result — Worker's result
   * @returns {Object} { quality_score (0-1), reasoning, pay_full }
   */
  async evaluateResult(task, result) {
    try {
      const evalPrompt = `You are evaluating a worker agent's result. Rate its quality from 0.0 to 1.0.

Task assigned: "${task.task}"
Agent type: ${task.agent}
Result status: ${result.status}
Result summary: ${result.summary || JSON.stringify(result).substring(0, 300)}

Return ONLY valid JSON:
{
  "quality_score": 0.85,
  "reasoning": "Brief explanation of quality assessment",
  "pay_full": true
}

Rules:
- score >= 0.7: pay_full = true (good work)
- score 0.3-0.7: pay_full = true but note concerns
- score < 0.3: pay_full = false (poor quality, skip payment)
- If the task was completed with relevant data, score high
- If the result is empty or irrelevant, score low`;

      const response = await this.model.invoke([
        new SystemMessage('You are a quality evaluator. Return only JSON.'),
        new HumanMessage(evalPrompt),
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
        quality_score: Math.min(1, Math.max(0, parsed.quality_score || 0)),
        reasoning: parsed.reasoning || 'No reasoning',
        pay_full: parsed.pay_full !== false,
      };
    } catch (err) {
      console.error(`[ManagerAgent] Quality evaluation error: ${err.message}`);
      // Default: pay on error (benefit of the doubt)
      return { quality_score: 0.7, reasoning: 'Evaluation failed, default score', pay_full: true };
    }
  }
}

module.exports = { ManagerAgent };
