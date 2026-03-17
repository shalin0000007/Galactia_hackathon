const express = require('express');
const cors = require('cors');
const config = require('./src/config');
const { authenticate } = require('./src/middleware/auth');
const { initAgentWallets, getAgentWallets } = require('./src/config/agentWallets');

// Import route handlers
const walletRoutes = require('./src/routes/wallet');

const app = express();

// ============================================================
//  Middleware
// ============================================================

// CORS — allow frontend origin
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// ============================================================
//  Routes
// ============================================================

// Health check — no auth required
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

// ============================================================
//  Error Handling
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      status: 404,
    },
  });
});

// Global error handler
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
  // Create the 3 agent wallets on startup
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
