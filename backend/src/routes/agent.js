/**
 * Agent API Route — POST /agent/run
 * 
 * Accepts a user prompt, runs the Manager → TaskRouter → Workers chain,
 * returns results with full agent trace log.
 */

const express = require('express');
const Joi = require('joi');
const { ManagerAgent } = require('../agents/managerAgent');
const { routeTasks } = require('../agents/taskRouter');
const { getAgentWallets } = require('../config/agentWallets');

const router = express.Router();
const manager = new ManagerAgent();

// Validate request body
const runSchema = Joi.object({
  prompt: Joi.string().min(3).max(1000).required(),
});

/**
 * POST /agent/run
 * Run the full agent chain: Manager → Router → Workers → Results
 */
router.post('/run', async (req, res) => {
  const chainStartTime = Date.now();

  try {
    // Validate input
    const { error, value } = runSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: error.details[0].message },
      });
    }

    const { prompt } = value;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[AgentAPI] New request: "${prompt}"`);
    console.log('='.repeat(60));

    // Step 1: Manager breaks prompt into sub-tasks
    console.log('\n[Step 1] Manager Agent processing...');
    const managerResult = await manager.processPrompt(prompt);
    console.log(`[Step 1] Manager assigned ${managerResult.tasks.length} tasks`);

    // Step 2: Route tasks to worker agents
    console.log('\n[Step 2] Routing tasks to workers...');
    const taskResults = await routeTasks(managerResult.tasks);
    console.log(`[Step 2] All ${taskResults.length} tasks completed`);

    // Step 3: Get updated wallet balances
    const wallets = getAgentWallets();
    const totalDuration = Date.now() - chainStartTime;

    // Build response
    const response = {
      success: true,
      prompt,
      manager_reasoning: managerResult.reasoning,
      tasks_assigned: managerResult.tasks.length,
      results: taskResults.map((r) => ({
        agent: r.agent,
        task: r.task_description,
        status: r.status,
        summary: r.result?.summary || 'No summary',
        payment: r.payment,
        duration_ms: r.duration_ms,
      })),
      wallet_balances: {
        manager: wallets.manager ? { balance: wallets.manager.balance, currency: 'USDT' } : null,
        research: wallets.research ? { balance: wallets.research.balance, currency: 'USDT' } : null,
        execution: wallets.execution ? { balance: wallets.execution.balance, currency: 'USDT' } : null,
      },
      trace: {
        total_tasks: taskResults.length,
        completed: taskResults.filter((r) => r.status === 'completed').length,
        failed: taskResults.filter((r) => r.status === 'failed').length,
        total_payment: taskResults.reduce((sum, r) => sum + (r.payment.status === 'paid' ? r.payment.amount : 0), 0),
        total_duration_ms: totalDuration,
      },
    };

    console.log(`\n[AgentAPI] Chain complete in ${totalDuration}ms`);
    console.log(`[AgentAPI] Tasks: ${response.trace.completed} completed, ${response.trace.failed} failed`);
    console.log(`[AgentAPI] Total payment: ${response.trace.total_payment} USDT\n`);

    res.json(response);
  } catch (err) {
    console.error('[AgentAPI] Chain error:', err.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_CHAIN_FAILED',
        message: err.message,
        duration_ms: Date.now() - chainStartTime,
      },
    });
  }
});

/**
 * GET /agent/status
 * Get current agent wallet balances and status
 */
router.get('/status', (req, res) => {
  const wallets = getAgentWallets();
  res.json({
    success: true,
    agents: {
      manager: wallets.manager ? { name: wallets.manager.name, address: wallets.manager.address, balance: wallets.manager.balance } : null,
      research: wallets.research ? { name: wallets.research.name, address: wallets.research.address, balance: wallets.research.balance } : null,
      execution: wallets.execution ? { name: wallets.execution.name, address: wallets.execution.address, balance: wallets.execution.balance } : null,
    },
  });
});

module.exports = router;
