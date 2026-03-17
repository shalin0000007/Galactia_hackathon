const express = require('express');
const cors = require('cors');
const config = require('./src/config');
const { authenticate } = require('./src/middleware/auth');

// Import route handlers
const generateRoutes = require('./src/routes/generate');
const autocompleteRoutes = require('./src/routes/autocomplete');
const bugDetectionRoutes = require('./src/routes/bugDetection');

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

// Parse JSON bodies (limit: 10MB for large code files)
app.use(express.json({ limit: '10mb' }));

// ============================================================
//  Routes
// ============================================================

// Health check — no auth required
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CodeMind AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API v1 routes — auth required
app.use('/api/v1/generate', authenticate, generateRoutes);
app.use('/api/v1/autocomplete', authenticate, autocompleteRoutes);
app.use('/api/v1/bugs', authenticate, bugDetectionRoutes);

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

app.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║         🧠  CodeMind AI Backend              ║
  ║         Running on port ${config.port}                ║
  ║         Environment: ${config.nodeEnv}          ║
  ║         AI Provider: ${config.aiProvider}              ║
  ╚══════════════════════════════════════════════╝
  `);
  console.log(`  Health check: http://localhost:${config.port}/health`);
  console.log(`  API base:     http://localhost:${config.port}/api/v1\n`);
});

module.exports = app;
