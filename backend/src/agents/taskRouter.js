/**
 * Task Router — Routes tasks to the correct agent
 * 
 * Receives an array of tasks from the Manager Agent,
 * dispatches each to the appropriate worker agent,
 * and collects results.
 */

const { ResearchAgent } = require('./researchAgent');
const { ExecutionAgent } = require('./executionAgent');
const walletService = require('../services/walletService');
const { getAgentWallets } = require('../config/agentWallets');

// Singleton agent instances
const researchAgent = new ResearchAgent();
const executionAgent = new ExecutionAgent();

/**
 * Route and execute an array of tasks
 * @param {Array} tasks - [{ agent: "research"|"execution", task: string, payment: number }]
 * @returns {Array} Results with payment info and trace data
 */
async function routeTasks(tasks) {
  const results = [];
  const agentWallets = getAgentWallets();

  for (const task of tasks) {
    console.log(`\n[TaskRouter] Routing to ${task.agent}: "${task.task}"`);
    const taskStartTime = Date.now();

    let result;
    let workerWallet;

    try {
      if (task.agent === 'research') {
        result = await researchAgent.research(task.task);
        workerWallet = agentWallets.research;
      } else if (task.agent === 'execution') {
        result = await executionAgent.executeTask(task.task);
        workerWallet = agentWallets.execution;
      } else {
        result = {
          agent: task.agent,
          status: 'failed',
          summary: `Unknown agent type: ${task.agent}`,
          duration_ms: 0,
        };
      }

      // Attempt payment if task succeeded and wallets exist
      let paymentResult = null;
      if (result.status === 'completed' && agentWallets.manager && workerWallet) {
        try {
          paymentResult = await walletService.sendUSDT(
            agentWallets.manager.address,
            workerWallet.address,
            task.payment
          );
          console.log(`[TaskRouter] Payment: ${task.payment} USDT → ${task.agent} agent | tx: ${paymentResult.txHash}`);
        } catch (payErr) {
          console.error(`[TaskRouter] Payment failed: ${payErr.message}`);
          paymentResult = { error: payErr.message };
        }
      }

      results.push({
        task_description: task.task,
        agent: task.agent,
        status: result.status,
        result: result,
        payment: {
          amount: task.payment,
          currency: 'USDT',
          status: paymentResult && !paymentResult.error ? 'paid' : 'unpaid',
          tx_hash: paymentResult?.txHash || null,
        },
        duration_ms: Date.now() - taskStartTime,
      });
    } catch (error) {
      console.error(`[TaskRouter] Error routing task: ${error.message}`);
      results.push({
        task_description: task.task,
        agent: task.agent,
        status: 'failed',
        result: { error: error.message },
        payment: { amount: task.payment, currency: 'USDT', status: 'unpaid', tx_hash: null },
        duration_ms: Date.now() - taskStartTime,
      });
    }
  }

  return results;
}

module.exports = { routeTasks };
