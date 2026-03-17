const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { createWallet, getBalance, sendUSDT, wallets } = require('./walletService');
const aiService = require('./src/services/aiService');

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
// AI ROUTES
// ----------------------------------------

// Generate code based on a prompt
app.post('/api/v1/generate', async (req, res) => {
  const { prompt, fileContent, language } = req.body;
  
  if (!prompt || !language) {
    return res.status(400).json({ status: 'error', message: 'Missing prompt or language' });
  }

  try {
    const result = await aiService.generateCode({ prompt, fileContent, language });
    res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('AI Error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Autocomplete code
app.post('/api/v1/autocomplete', async (req, res) => {
  const { partialCode, language } = req.body;
  
  if (!partialCode || !language) {
    return res.status(400).json({ status: 'error', message: 'Missing partialCode or language' });
  }

  try {
    const result = await aiService.getAutoComplete({ partialCode, language });
    res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('AI Error:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
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
