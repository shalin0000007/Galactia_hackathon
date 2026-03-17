/**
 * agentBase.js — Agent Base Class
 *
 * Day 2 (Person B): Foundation for all AI agents in AgentPay.
 * Each agent has a name, role, wallet address, and capabilities.
 * Uses LangChain ChatOpenAI for LLM interactions.
 */

const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const config = require('../config');
const { agentWallets } = require('../config/agentWallets');

class AgentBase {
  /**
   * @param {Object} options
   * @param {string} options.name         — Display name (e.g. "Research Agent")
   * @param {string} options.role         — Role key matching config.ai keys: 'manager' | 'research' | 'execution'
   * @param {string[]} options.capabilities — List of task types this agent can handle
   * @param {string} options.systemPrompt — System-level instruction for the LLM
   */
  constructor({ name, role, capabilities = [], systemPrompt = '' }) {
    this.name = name;
    this.role = role;
    this.capabilities = capabilities;
    this.systemPrompt = systemPrompt;

    // Link to the Day 1 wallet for this role
    const walletInfo = agentWallets[role];
    this.walletAddress = walletInfo ? walletInfo.address : null;

    // Initialise the LLM with role-specific settings from config
    // Uses Groq API (OpenAI-compatible endpoint)
    const aiConfig = config.ai[role] || config.ai.research;
    this.llm = new ChatOpenAI({
      modelName: aiConfig.model,
      temperature: aiConfig.temperature,
      maxTokens: aiConfig.maxTokens,
      apiKey: config.groqApiKey,
      configuration: {
        baseURL: 'https://api.groq.com/openai/v1',
      },
    });
  }

  // ----------------------------------------------------------------
  //  Core execution — override in subclasses for task-specific logic
  // ----------------------------------------------------------------

  /**
   * Execute a task described by a plain-text string.
   * @param {string} taskDescription
   * @returns {Promise<Object>} — Structured result object
   */
  async execute(taskDescription) {
    const startTime = Date.now();

    try {
      const response = await this.llm.invoke([
        new SystemMessage(this.systemPrompt),
        new HumanMessage(taskDescription),
      ]);

      const durationMs = Date.now() - startTime;
      const raw = response.content;

      // Try to extract JSON from the LLM response
      const parsed = this._parseJSON(raw);

      return {
        agent: this.role,
        agentName: this.name,
        wallet: this.walletAddress,
        task: taskDescription,
        result: parsed || raw,
        status: 'completed',
        durationMs,
      };
    } catch (error) {
      console.error(`[${this.name}] Execution error:`, error.message);
      return {
        agent: this.role,
        agentName: this.name,
        wallet: this.walletAddress,
        task: taskDescription,
        error: error.message,
        status: 'failed',
        durationMs: Date.now() - startTime,
      };
    }
  }

  // ----------------------------------------------------------------
  //  Utilities
  // ----------------------------------------------------------------

  /**
   * Check whether this agent can handle a given task type.
   * @param {string} taskType
   * @returns {boolean}
   */
  canHandle(taskType) {
    return this.capabilities.includes(taskType);
  }

  /**
   * Return agent metadata.
   */
  getInfo() {
    return {
      name: this.name,
      role: this.role,
      walletAddress: this.walletAddress,
      capabilities: this.capabilities,
    };
  }

  /**
   * Try to parse a JSON block out of the LLM response.
   * Handles both raw JSON and markdown-fenced JSON (```json … ```).
   * @param {string} text
   * @returns {Object|null}
   */
  _parseJSON(text) {
    try {
      // First try direct parse
      return JSON.parse(text);
    } catch {
      // Try to extract from markdown code fence
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        try {
          return JSON.parse(match[1].trim());
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}

module.exports = AgentBase;
