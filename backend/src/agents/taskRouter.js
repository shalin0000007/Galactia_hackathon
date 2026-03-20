/**
 * Task Router — Routes tasks to the correct agent
 *
 * Receives an array of tasks from the Manager Agent,
 * validates budget constraints, runs quality evaluation,
 * and dispatches each to the appropriate worker agent.
 */

const { ResearchAgent } = require('./researchAgent');
const { ExecutionAgent } = require('./executionAgent');
const { ManagerAgent } = require('./managerAgent');
const { ComplianceAgent } = require('./complianceAgent');
const walletService = require('../services/walletService');
const { recordPayment } = require('../services/paymentStore');
const dbService = require('../services/dbService');
const explorerService = require('../services/explorerService');
const paymentConfig = require('../config/paymentConfig');
const auditLog = require('../services/auditLog');
const { getAgentWallets } = require('../config/agentWallets');

// Singleton agent instances
const researchAgent = new ResearchAgent();
const executionAgent = new ExecutionAgent();
const complianceGate = new ComplianceAgent(); // New pre-flight firewall
const qualityEvaluator = new ManagerAgent(); // Reuses Manager LLM for quality eval

/**
 * Route and execute an array of tasks
 * @param {Array} tasks - [{ agent: "research"|"execution", task: string, payment: number }]
 * @returns {Array} Results with payment info and trace data
 */
async function routeTasks(tasks) {
  const results = [];
  const agentWallets = getAgentWallets();

  // ── Pre-flight budget check ──────────────────────────
  const budgetCheck = paymentConfig.checkBudget(tasks);
  auditLog.log('budget_checked', 'TaskRouter', {
    estimatedCost: budgetCheck.estimatedCost,
    approved: budgetCheck.approved,
    dailySpend: budgetCheck.dailySpendSoFar,
  });

  if (!budgetCheck.approved) {
    const reason = !budgetCheck.withinRunBudget
      ? `Estimated cost (${budgetCheck.estimatedCost} USDT) exceeds per-run limit (${paymentConfig.budget.maxPerRun} USDT)`
      : `Daily spending limit reached (${budgetCheck.dailySpendSoFar}/${paymentConfig.budget.maxDailySpend} USDT)`;

    auditLog.log('budget_exceeded', 'TaskRouter', { reason });
    console.error(`[TaskRouter] ❌ Budget rejected: ${reason}`);
    return tasks.map(task => ({
      task_description: task.task,
      agent: task.agent,
      status: 'rejected',
      result: { error: reason, budget: budgetCheck },
      payment: { amount: task.payment, currency: 'USDT', status: 'budget_exceeded', tx_hash: null },
      duration_ms: 0,
    }));
  }

  if (budgetCheck.warning) {
    console.warn(`[TaskRouter] ⚠️  ${budgetCheck.warning}`);
  }

  // ── PRE-FLIGHT COMPLIANCE CHECK ─────────────────────
  console.log('\n[TaskRouter] Running Compliance Audit...');
  const complianceCheck = await complianceGate.auditPlan(tasks);
  auditLog.log('compliance_audit', 'ComplianceAgent', { safe: complianceCheck.is_safe, risk: complianceCheck.risk_level, reason: complianceCheck.reasoning });
  
  if (!complianceCheck.is_safe) {
    console.error(`[TaskRouter] 🛑 Compliance blocked execution: ${complianceCheck.reasoning} (Risk: ${complianceCheck.risk_level})`);
    return tasks.map(task => ({
      task_description: task.task,
      agent: task.agent,
      status: 'rejected_by_compliance',
      result: { error: complianceCheck.reasoning },
      quality: null,
      payment: { amount: 0, currency: 'USDT', status: 'compliance_blocked', tx_hash: null },
      duration_ms: complianceCheck.duration_ms,
    }));
  }
  console.log(`[TaskRouter] ✅ Compliance passed (Risk: ${complianceCheck.risk_level})`);

  // ── Execute tasks ────────────────────────────────────
  for (const task of tasks) {
    console.log(`\n[TaskRouter] Routing to ${task.agent}: "${task.task}"`);
    auditLog.log('task_routed', 'TaskRouter', { agent: task.agent, task: task.task });
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

      auditLog.log('task_completed', task.agent, { status: result.status });

      // ── Quality evaluation ─────────────────────────────
      let qualityResult = { quality_score: 1.0, reasoning: 'Default', pay_full: true };
      if (result.status === 'completed') {
        try {
          qualityResult = await qualityEvaluator.evaluateResult(task, result);
          auditLog.log('quality_evaluated', 'Manager', {
            agent: task.agent,
            score: qualityResult.quality_score,
            pay_full: qualityResult.pay_full,
          });
          console.log(`[TaskRouter] Quality: ${qualityResult.quality_score.toFixed(2)} → ${qualityResult.pay_full ? 'PAY' : 'SKIP'}`);
        } catch (qErr) {
          console.error(`[TaskRouter] Quality evaluation failed: ${qErr.message}`);
        }
      }

      // ── Payment (quality-gated) ────────────────────────
      let paymentResult = null;
      let explorerUrl = null;
      const shouldPay = result.status === 'completed' && qualityResult.pay_full;

      if (shouldPay && agentWallets.manager && workerWallet && paymentConfig.autoPayEnabled) {
        try {
          const paymentAmount = paymentConfig.getPaymentAmount(task.agent);
          paymentResult = await walletService.sendUSDT(
            agentWallets.manager.address,
            workerWallet.address,
            paymentAmount
          );
          console.log(`[TaskRouter] ✅ Payment: ${paymentAmount} USDT → ${task.agent} agent | tx: ${paymentResult.txHash}`);

          // Track daily spending
          paymentConfig.recordSpend(paymentAmount);

          // 1) Record in-memory
          recordPayment({
            from: agentWallets.manager.address,
            fromName: agentWallets.manager.name,
            to: workerWallet.address,
            toName: workerWallet.name,
            amount: paymentAmount,
            currency: 'USDT',
            txHash: paymentResult.txHash,
            agentType: task.agent,
            taskDescription: task.task,
          });

          // 2) Persist to payments.json
          dbService.recordPayment(
            paymentResult.txHash,
            workerWallet.name,
            paymentAmount,
            paymentResult.txHash
          );

          // 3) Get block explorer URL
          explorerUrl = explorerService.getExplorerUrl(paymentResult.txHash);

        } catch (payErr) {
          console.error(`[TaskRouter] Payment failed: ${payErr.message}`);
          paymentResult = { error: payErr.message };
        }
      } else if (!qualityResult.pay_full) {
        auditLog.log('payment_skipped', 'TaskRouter', {
          agent: task.agent,
          reason: `Quality too low (${qualityResult.quality_score.toFixed(2)})`,
        });
      }

      results.push({
        task_description: task.task,
        agent: task.agent,
        status: result.status,
        result: result,
        quality: {
          score: qualityResult.quality_score,
          reasoning: qualityResult.reasoning,
          paid: qualityResult.pay_full,
        },
        payment: {
          amount: task.payment,
          currency: 'USDT',
          network: 'Sonic',
          status: paymentResult && !paymentResult.error ? 'paid' :
                  !qualityResult.pay_full ? 'quality_rejected' : 'unpaid',
          tx_hash: paymentResult?.txHash || null,
          explorer_url: explorerUrl,
        },
        duration_ms: Date.now() - taskStartTime,
      });
    } catch (error) {
      auditLog.log('task_failed', task.agent, { error: error.message });
      console.error(`[TaskRouter] Error routing task: ${error.message}`);
      results.push({
        task_description: task.task,
        agent: task.agent,
        status: 'failed',
        result: { error: error.message },
        quality: null,
        payment: { amount: task.payment, currency: 'USDT', status: 'unpaid', tx_hash: null },
        duration_ms: Date.now() - taskStartTime,
      });
    }
  }

  return results;
}

module.exports = { routeTasks };
