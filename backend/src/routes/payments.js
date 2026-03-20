/**
 * Payments API Routes
 * 
 * GET /payments        — list all payments (with optional filters)
 * GET /payments/stats  — payment statistics
 * GET /payments/:id    — get single payment by ID or txHash
 */

const express = require('express');
const { getPayments, getPayment, getPaymentStats } = require('../services/paymentStore');
const dbService = require('../services/dbService');
const explorerService = require('../services/explorerService');

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

    // In-memory payments (current session)
    const memPayments = getPayments(filters);

    // Persistent payments from DB (survives restarts — Person B)
    const dbPayments = dbService.getPayments();

    res.json({
      success: true,
      count: memPayments.length,
      payments: memPayments,
      persisted: {
        count: dbPayments.length,
        payments: dbPayments,
      },
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
    // Check in-memory first, then DB
    let payment = getPayment(req.params.id);
    let source = 'memory';

    if (!payment) {
      payment = dbService.getPaymentByHash(req.params.id);
      source = 'db';
    }

    if (!payment) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Payment not found' },
      });
    }

    // Add explorer URL (Person B)
    const txHash = payment.txHash || payment.tx_hash;
    const explorerUrl = txHash ? explorerService.getExplorerUrl(txHash) : null;

    res.json({ success: true, source, payment: { ...payment, explorer_url: explorerUrl } });
  } catch (err) {
    console.error('[Payments] Error:', err.message);
    res.status(500).json({
      error: { code: 'FETCH_FAILED', message: err.message },
    });
  }
});

module.exports = router;
