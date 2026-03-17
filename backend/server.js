const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { createWallet, getBalance, sendUSDT, wallets } = require('./walletService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ----------------------------------------
// HEALTH CHECK
// ----------------------------------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ----------------------------------------
// WALLET ROUTES 
// ----------------------------------------

// Create new wallet
app.post('/wallet/create', async (req, res) => {
  const { name } = req.body;
  const result = await createWallet(name || 'default');
  res.json({ success: true, data: result });
});

// Get balance
app.get('/wallet/balance/:address', async (req, res) => {
  const { address } = req.params;
  const result = await getBalance(address);
  res.json({ success: true, data: result });
});

// Send USDT (or USDC depending on network availability)
app.post('/wallet/send', async (req, res) => {
  const { fromName, toAddress, amount } = req.body;
  if (!fromName || !toAddress || !amount) {
    return res.status(400).json({ success: false, error: "Missing fromName, toAddress, or amount" });
  }
  const result = await sendUSDT(fromName, toAddress, amount);
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Optional: Check if we need to auto-initialize the 3 agent wallets (Manager, Research, Execution)
  // Usually this is done via a setup script or config.js, but keeping it in the server startup logs it nicely.
  console.log(`API endpoints:`);
  console.log(`  GET  /health`);
  console.log(`  POST /wallet/create (body: { name: string })`);
  console.log(`  GET  /wallet/balance/:address`);
  console.log(`  POST /wallet/send (body: { fromName, toAddress, amount })`);
});
