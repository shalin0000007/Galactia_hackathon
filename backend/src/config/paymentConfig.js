/**
 * Payment Configuration
 * 
 * Defines payment amounts per agent task type.
 * Manager pays workers after successful task completion.
 */

const paymentConfig = {
  // Payment amounts per task type (in USDT)
  taskPayments: {
    research: 0.5,   // Research tasks: market analysis, data collection
    execution: 1.0,  // Execution tasks: trades, transactions
  },

  // Payment settings
  currency: 'USDT',
  autoPayEnabled: true, // Automatically pay agents after task completion

  // Get payment amount for a task type
  getPaymentAmount(agentType) {
    return this.taskPayments[agentType] || 0;
  },
};

module.exports = paymentConfig;
