/**
 * Manager Agent — The orchestrator
 * 
 * Receives user prompts, breaks them into sub-tasks,
 * and assigns to Research or Execution agents.
 */

const { ChatGroq } = require('@langchain/groq');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const config = require('../config');

const MANAGER_SYSTEM_PROMPT = `You are the Manager Agent in AgentPay — an AI-powered autonomous payment system.

Your job:
1. Receive a user request
2. Break it into 1-3 sub-tasks
3. Assign each sub-task to the correct worker agent

Available worker agents:
- "research": Research Agent — for data gathering, market analysis, comparing options, collecting information
- "execution": Execution Agent — for executing trades, making transactions, taking actions

Rules:
- Always return valid JSON (no markdown, no code blocks)
- Each task must have: agent (research or execution), task (clear description), payment (0.5 for research, 1.0 for execution)
- Keep tasks focused and specific
- Maximum 3 sub-tasks per request
- If the request is unclear, create a research task to clarify first

Response format:
{
  "reasoning": "Brief explanation of how you broke down the request",
  "tasks": [
    { "agent": "research", "task": "Analyze top 5 cryptocurrencies by market cap and recent performance", "payment": 0.5 },
    { "agent": "execution", "task": "Execute a small trade of 0.1 USDT in the top-performing crypto", "payment": 1.0 }
  ]
}`;

class ManagerAgent {
  constructor() {
    this.name = 'Manager Agent';
    this.model = new ChatGroq({
      model: 'llama-3.3-70b-versatile',
      temperature: config.ai.manager.temperature,
      maxTokens: config.ai.manager.maxTokens,
      apiKey: process.env.GROQ_API_KEY,
    });
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
}

module.exports = { ManagerAgent };
