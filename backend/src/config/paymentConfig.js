/**
 * Payment & Budget Configuration
 *
 * Defines payment amounts, budget caps, and economic constraints
 * for the multi-agent system. All payments settle in real USDT
 * on the Sonic network via WDK.
 */

const paymentConfig = {
  // Payment amounts per task type (in USDT)
  taskPayments: {
    research: 2.0,   // Research tasks: market analysis, data collection
    execution: 5.0,  // Execution tasks: trades, transactions
  },

  // Budget constraints
  budget: {
    maxPerRun: 20.0,         // Max USDT per single agent run
    maxDailySpend: 150.0,    // Max USDT per day across all runs
    warningThreshold: 15.0,  // Warn user if estimated cost exceeds this
  },

  // Payment settings
  currency: 'USDT',
  network: 'Sonic',
  autoPayEnabled: true,  // Automatically pay agents after task completion

  // Spending tracker (resets daily)
  _dailySpend: 0,
  _dailyResetDate: new Date().toDateString(),

  // Get payment amount for a task type
  getPaymentAmount(agentType) {
    return this.taskPayments[agentType] || 0;
  },

  // Calculate total cost for a set of tasks
  estimateCost(tasks) {
    return tasks.reduce((sum, task) => {
      const agentType = task.agent || task.agentType;
      return sum + this.getPaymentAmount(agentType);
    }, 0);
  },

  // Check if a run would exceed budget
  checkBudget(tasks) {
    const estimatedCost = this.estimateCost(tasks);

    // Reset daily tracker if new day
    if (new Date().toDateString() !== this._dailyResetDate) {
      this._dailySpend = 0;
      this._dailyResetDate = new Date().toDateString();
    }

    const result = {
      estimatedCost,
      withinRunBudget: estimatedCost <= this.budget.maxPerRun,
      withinDailyBudget: (this._dailySpend + estimatedCost) <= this.budget.maxDailySpend,
      dailySpendSoFar: this._dailySpend,
      dailyRemaining: this.budget.maxDailySpend - this._dailySpend,
      warning: estimatedCost > this.budget.warningThreshold ? 
        `Estimated cost (${estimatedCost} USDT) exceeds warning threshold` : null,
    };

    result.approved = result.withinRunBudget && result.withinDailyBudget;
    return result;
  },

  // Record spending after successful payment
  recordSpend(amount) {
    if (new Date().toDateString() !== this._dailyResetDate) {
      this._dailySpend = 0;
      this._dailyResetDate = new Date().toDateString();
    }
    this._dailySpend += amount;
  },

  // Get spending summary
  getSpendingSummary() {
    if (new Date().toDateString() !== this._dailyResetDate) {
      this._dailySpend = 0;
      this._dailyResetDate = new Date().toDateString();
    }
    return {
      dailySpend: this._dailySpend,
      dailyLimit: this.budget.maxDailySpend,
      dailyRemaining: this.budget.maxDailySpend - this._dailySpend,
      perRunLimit: this.budget.maxPerRun,
      currency: this.currency,
      network: this.network,
    };
  },
};

module.exports = paymentConfig;
