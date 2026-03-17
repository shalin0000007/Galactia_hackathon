const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./src/config');
const { authenticate } = require('./src/middleware/auth');
const { initAgentWallets, getAgentWallets } = require('./src/config/agentWallets');

// Import route handlers
const walletRoutes = require('./src/routes/wallet');
const agentRoutes = require('./src/routes/agent');
const paymentsRoutes = require('./src/routes/payments');

// Person B's services (Coinbase SDK wallet + AI)
let personBWalletService, personBAiService;
try {
  personBWalletService = require('./walletService');
  personBAiService = require('./src/services/aiService');
} catch (e) {
  // Person B's files may not exist yet — that's ok
}

const app = express();

// ============================================================
//  Middleware
// ============================================================

app.use(cors({
  origin: (origin, callback) => {
    // Allow all in development, or from frontend URL in production
    if (config.nodeEnv === 'development' || !origin || origin === config.frontendUrl) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ============================================================
//  Routes
// ============================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AgentPay Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Agent wallets info endpoint
app.get('/agents', (req, res) => {
  const wallets = getAgentWallets();
  res.json({
    success: true,
    agents: {
      manager: wallets.manager ? { name: wallets.manager.name, address: wallets.manager.address, balance: wallets.manager.balance } : null,
      research: wallets.research ? { name: wallets.research.name, address: wallets.research.address, balance: wallets.research.balance } : null,
      execution: wallets.execution ? { name: wallets.execution.name, address: wallets.execution.address, balance: wallets.execution.balance } : null,
    },
  });
});

// Wallet routes
app.use('/wallet', authenticate, walletRoutes);

// Agent routes
app.use('/agent', authenticate, agentRoutes);

// Payment history routes
app.use('/payments', authenticate, paymentsRoutes);

// ----------------------------------------
// AI ROUTES (Person B)
// ----------------------------------------
if (personBAiService) {
  app.post('/api/v1/generate', async (req, res) => {
    const { prompt, fileContent, language } = req.body;
    if (!prompt || !language) {
      return res.status(400).json({ status: 'error', message: 'Missing prompt or language' });
    }
    try {
      const result = await personBAiService.generateCode({ prompt, fileContent, language });
      res.json({ status: 'success', data: result });
    } catch (error) {
      console.error('AI Error:', error.message);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.post('/api/v1/autocomplete', async (req, res) => {
    const { partialCode, language } = req.body;
    if (!partialCode || !language) {
      return res.status(400).json({ status: 'error', message: 'Missing partialCode or language' });
    }
    try {
      const result = await personBAiService.getAutoComplete({ partialCode, language });
      res.json({ status: 'success', data: result });
    } catch (error) {
      console.error('AI Error:', error.message);
      res.status(500).json({ status: 'error', message: error.message });
    }
  });
}

// ============================================================
//  Error Handling
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      status: 404,
    },
  });
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      status: 500,
    },
  });
});

// ============================================================
//  Start Server
// ============================================================

async function startServer() {
  await initAgentWallets();

  app.listen(config.port, () => {
    console.log(`
  ╔══════════════════════════════════════════════╗
  ║         💰  AgentPay Backend                 ║
  ║         Running on port ${config.port}                ║
  ║         Environment: ${config.nodeEnv}          ║
  ║         AI Provider: ${config.aiProvider}              ║
  ╚══════════════════════════════════════════════╝
    `);
    console.log(`  Health check:   http://localhost:${config.port}/health`);
    console.log(`  Agent wallets:  http://localhost:${config.port}/agents`);
    console.log(`  Wallet API:     http://localhost:${config.port}/wallet\n`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
