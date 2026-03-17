/**
 * Payments API Routes
 * 
 * GET /payments        — list all payments (with optional filters)
 * GET /payments/stats  — payment statistics
 * GET /payments/:id    — get single payment by ID or txHash
 */

const express = require('express');
const { getPayments, getPayment, getPaymentStats } = require('../services/paymentStore');

const router = express.Router();

/**
 * GET /payments
 * List all payments with optional filters
 * Query params: ?agentType=research&status=confirmed&limit=50
 */
router.get('/', (req, res) => {
  try {
    const { agentType, status, limit } = req.query;
    const filters = {};
    if (agentType) filters.agentType = agentType;
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit, 10);

    const payments = getPayments(filters);
    res.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (err) {
    console.error('[Payments] Error:', err.message);
    res.status(500).json({
      error: { code: 'FETCH_FAILED', message: err.message },
    });
  }
});

/**
 * GET /payments/stats
 * Payment statistics (totals, by agent)
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getPaymentStats();
    res.json({ success: true, ...stats });
  } catch (err) {
    console.error('[Payments] Stats error:', err.message);
    res.status(500).json({
      error: { code: 'STATS_FAILED', message: err.message },
    });
  }
});

/**
 * GET /payments/:id
 * Get a single payment by ID or tx hash
 */
router.get('/:id', (req, res) => {
  try {
    const payment = getPayment(req.params.id);
    if (!payment) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Payment not found' },
      });
    }
    res.json({ success: true, payment });
  } catch (err) {
    console.error('[Payments] Error:', err.message);
    res.status(500).json({
      error: { code: 'FETCH_FAILED', message: err.message },
    });
  }
});

module.exports = router;
