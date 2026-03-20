const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./src/config');
const { authenticate } = require('./src/middleware/auth');
const { initAgentWallets, getAgentWallets } = require('./src/config/agentWallets');
const walletService = require('./src/services/walletService');

// Import route handlers
const walletRoutes = require('./src/routes/wallet');
const agentRoutes = require('./src/routes/agent');
const paymentsRoutes = require('./src/routes/payments');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

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

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss: '.swagger-ui .topbar { display: none }' }));

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

// Agent wallets info endpoint — fetches live on-chain balances
app.get('/agents', async (req, res) => {
  try {
    const wallets = getAgentWallets();
    // Fetch live USDT balances from Sonic
    const [mBal, rBal, eBal] = await Promise.all([
      wallets.manager ? walletService.getBalance(wallets.manager.address) : null,
      wallets.research ? walletService.getBalance(wallets.research.address) : null,
      wallets.execution ? walletService.getBalance(wallets.execution.address) : null,
    ]);
    res.json({
      success: true,
      network: 'Sonic (Chain ID 146)',
      agents: {
        manager: wallets.manager ? { name: wallets.manager.name, address: wallets.manager.address, balance: mBal?.balance ?? 0 } : null,
        research: wallets.research ? { name: wallets.research.name, address: wallets.research.address, balance: rBal?.balance ?? 0 } : null,
        execution: wallets.execution ? { name: wallets.execution.name, address: wallets.execution.address, balance: eBal?.balance ?? 0 } : null,
      },
    });
  } catch (err) {
    console.error('[Agents] Error fetching live balances:', err.message);
    // Fallback to cached balances
    const wallets = getAgentWallets();
    res.json({
      success: true,
      network: 'Sonic (Chain ID 146)',
      agents: {
        manager: wallets.manager ? { name: wallets.manager.name, address: wallets.manager.address, balance: wallets.manager.balance } : null,
        research: wallets.research ? { name: wallets.research.name, address: wallets.research.address, balance: wallets.research.balance } : null,
        execution: wallets.execution ? { name: wallets.execution.name, address: wallets.execution.address, balance: wallets.execution.balance } : null,
      },
    });
  }
});

// Budget & spending info
const paymentConfig = require('./src/config/paymentConfig');
app.get('/agent/budget', (req, res) => {
  const summary = paymentConfig.getSpendingSummary();
  res.json({ success: true, ...summary });
});

// Audit trail — shows every agent action
const auditLog = require('./src/services/auditLog');
app.get('/agent/audit', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const action = req.query.action || null;
  const entries = auditLog.getEntries({ action, limit });
  const summary = auditLog.getSummary();
  res.json({ success: true, summary, entries });
});

// WalletGuard status — shows safety configuration
const walletGuard = require('./src/services/walletGuard');
app.get('/agent/guard', (req, res) => {
  const status = walletGuard.getGuardStatus();
  res.json({ success: true, ...status });
});

// ── DeFi Integration Endpoints ──────────────────────────
const aaveService = require('./src/services/aaveService');
const bridgeService = require('./src/services/bridgeService');

// Aave V3 — Live lending rates
app.get('/defi/aave', async (req, res) => {
  const chain = req.query.chain || 'ethereum';
  try {
    const data = await aaveService.getReserveData(chain);
    res.json({ success: true, protocol: 'Aave V3', ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/defi/aave/all', async (req, res) => {
  try {
    const data = await aaveService.getMultiChainData();
    res.json({ success: true, protocol: 'Aave V3', chains: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// USDT0 Bridge — Cross-chain transfer estimation
app.get('/defi/bridge/chains', (req, res) => {
  const chains = bridgeService.getSupportedChains();
  res.json({ success: true, ...chains });
});

app.get('/defi/bridge/estimate', async (req, res) => {
  const { from, to, amount } = req.query;
  if (!from || !to || !amount) {
    return res.status(400).json({ success: false, error: 'Required params: from, to, amount' });
  }
  const estimate = await bridgeService.estimateBridgeFee(from, to, Number(amount));
  res.json({ success: true, ...estimate });
});

app.get('/defi/bridge/status', (req, res) => {
  const status = bridgeService.getBridgeStatus();
  res.json({ success: true, ...status });
});

// Wallet routes
app.use('/wallet', authenticate, walletRoutes);

// Agent routes
app.use('/agent', authenticate, agentRoutes);

// Payment history routes
app.use('/payments', authenticate, paymentsRoutes);

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
  ║         Network: Sonic Blaze Testnet (Chain ID 57054) ║
  ║         Wallets: WDK (Tether)                ║
  ║         AI Provider: ${config.aiProvider}              ║
  ╚══════════════════════════════════════════════╝
    `);
    console.log(`  Health check:   http://localhost:${config.port}/health`);
    console.log(`  Agent wallets:  http://localhost:${config.port}/agents`);
    console.log(`  API Docs:       http://localhost:${config.port}/api-docs`);
    console.log(`  Aave V3 Rates:  http://localhost:${config.port}/defi/aave`);
    console.log(`  Bridge Chains:  http://localhost:${config.port}/defi/bridge/chains`);
    console.log(`  Explorer:       ${config.sonic.explorerUrl}`);
    console.log(`  Wallet API:     http://localhost:${config.port}/wallet\n`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
