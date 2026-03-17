const express = require('express');
const Joi = require('joi');
const walletService = require('../services/walletService');

const router = express.Router();

/**
 * POST /wallet/create
 * Create a new wallet
 */
const createSchema = Joi.object({
  name: Joi.string().min(1).max(50).default('Agent'),
});

router.post('/create', async (req, res) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: error.details[0].message, status: 400 },
      });
    }

    const wallet = await walletService.createWallet(value.name);
    res.status(201).json({
      success: true,
      wallet: {
        address: wallet.address,
        name: wallet.name,
        balance: wallet.balance,
        createdAt: wallet.createdAt,
      },
    });
  } catch (err) {
    console.error('[Wallet/Create] Error:', err.message);
    res.status(500).json({
      error: { code: 'WALLET_CREATION_FAILED', message: err.message, status: 500 },
    });
  }
});

/**
 * GET /wallet/balance/:addr
 * Get wallet balance by address
 */
router.get('/balance/:addr', async (req, res) => {
  try {
    const { addr } = req.params;
    if (!addr) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Wallet address is required', status: 400 },
      });
    }

    const balance = await walletService.getBalance(addr);
    res.json({
      success: true,
      ...balance,
    });
  } catch (err) {
    console.error('[Wallet/Balance] Error:', err.message);
    if (err.message.includes('not found')) {
      return res.status(404).json({
        error: { code: 'WALLET_NOT_FOUND', message: err.message, status: 404 },
      });
    }
    res.status(500).json({
      error: { code: 'BALANCE_CHECK_FAILED', message: err.message, status: 500 },
    });
  }
});

/**
 * POST /wallet/send
 * Send USDT from one wallet to another
 */
const sendSchema = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  amount: Joi.number().positive().required(),
});

router.post('/send', async (req, res) => {
  try {
    const { error, value } = sendSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: error.details[0].message, status: 400 },
      });
    }

    const { from, to, amount } = value;
    const tx = await walletService.sendUSDT(from, to, amount);

    res.json({
      success: true,
      transaction: tx,
    });
  } catch (err) {
    console.error('[Wallet/Send] Error:', err.message);
    if (err.message.includes('not found')) {
      return res.status(404).json({
        error: { code: 'WALLET_NOT_FOUND', message: err.message, status: 404 },
      });
    }
    if (err.message.includes('Insufficient')) {
      return res.status(400).json({
        error: { code: 'INSUFFICIENT_BALANCE', message: err.message, status: 400 },
      });
    }
    res.status(500).json({
      error: { code: 'TRANSFER_FAILED', message: err.message, status: 500 },
    });
  }
});

/**
 * GET /wallet/all
 * Get all wallets (for dashboard)
 */
router.get('/all', async (req, res) => {
  try {
    const wallets = await walletService.getAllWallets();
    res.json({ success: true, wallets });
  } catch (err) {
    console.error('[Wallet/All] Error:', err.message);
    res.status(500).json({
      error: { code: 'FETCH_FAILED', message: err.message, status: 500 },
    });
  }
});

module.exports = router;
