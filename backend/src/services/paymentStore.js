/**
 * Payment Store — Simple JSON-based payment history
 * 
 * Stores all payments in memory with methods to query.
 * Day 3: In-memory store. Can be replaced with SQLite/Postgres later.
 */

const { v4: uuidv4 } = require('uuid');

// In-memory payment records
const payments = [];

/**
 * Record a payment
 * @param {Object} paymentData - { from, to, amount, currency, txHash, taskId, agentType, taskDescription }
 * @returns {Object} The stored payment record
 */
function recordPayment({ from, fromName, to, toName, amount, currency, txHash, taskId, agentType, taskDescription }) {
  const record = {
    id: uuidv4(),
    from,
    fromName: fromName || 'Unknown',
    to,
    toName: toName || 'Unknown',
    amount,
    currency: currency || 'USDT',
    txHash: txHash || null,
    taskId: taskId || null,
    agentType: agentType || 'unknown',
    taskDescription: taskDescription || '',
    status: txHash ? 'confirmed' : 'failed',
    timestamp: new Date().toISOString(),
  };

  payments.push(record);
  console.log(`[PaymentStore] Recorded: ${fromName} → ${toName} | ${amount} ${currency} | ${record.status}`);
  return record;
}

/**
 * Get all payments
 * @param {Object} filters - Optional { agentType, status, limit }
 * @returns {Array} Payment records
 */
function getPayments(filters = {}) {
  let result = [...payments];

  if (filters.agentType) {
    result = result.filter((p) => p.agentType === filters.agentType);
  }
  if (filters.status) {
    result = result.filter((p) => p.status === filters.status);
  }

  // Sort newest first
  result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (filters.limit) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

/**
 * Get payment by ID or txHash
 * @param {string} identifier - Payment ID or tx hash
 * @returns {Object|null}
 */
function getPayment(identifier) {
  return payments.find((p) => p.id === identifier || p.txHash === identifier) || null;
}

/**
 * Get payment statistics
 * @returns {Object} { totalPayments, totalAmount, byAgent }
 */
function getPaymentStats() {
  const stats = {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + (p.status === 'confirmed' ? p.amount : 0), 0),
    currency: 'USDT',
    byAgent: {
      research: {
        count: payments.filter((p) => p.agentType === 'research' && p.status === 'confirmed').length,
        total: payments.filter((p) => p.agentType === 'research' && p.status === 'confirmed').reduce((s, p) => s + p.amount, 0),
      },
      execution: {
        count: payments.filter((p) => p.agentType === 'execution' && p.status === 'confirmed').length,
        total: payments.filter((p) => p.agentType === 'execution' && p.status === 'confirmed').reduce((s, p) => s + p.amount, 0),
      },
    },
  };
  return stats;
}

module.exports = { recordPayment, getPayments, getPayment, getPaymentStats };
