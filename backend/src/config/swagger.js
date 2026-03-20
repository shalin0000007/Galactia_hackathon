const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AgentPay API (WDK Edition)',
      version: '1.0.0',
      description: 'Interactive API documentation for AgentPay — an autonomous multi-agent payment system powered by Tether WDK on the Sonic Network. Try the endpoints below to see real on-chain interactions.',
      contact: {
        name: 'AgentPay Team'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Server'
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/agents': {
        get: {
          summary: 'Get Live Agent Balances',
          description: 'Fetches real-time USDT balances directly from the Sonic Network for Manager, Research, and Execution agents via WDK.',
          responses: { '200': { description: 'Live wallet data' } }
        }
      },
      '/agent/run': {
        post: {
          summary: 'Execute Agent Chain (Prompt)',
          description: 'Triggers the Manager Agent to decompose a prompt, evaluates quality, and executes on-chain USDT payments via WDK.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 
              'application/json': { 
                schema: { 
                  type: 'object', 
                  properties: { 
                    prompt: { 
                      type: 'string', 
                      example: 'Research the top 3 highest yielding stablecoin pools globally' 
                    } 
                  } 
                } 
              } 
            }
          },
          responses: { '200': { description: 'Full execution trace and payment status' } }
        }
      },
      '/agent/audit': {
        get: {
          summary: 'View Immutable Audit Trail',
          description: 'Retrieves the complete log of all agent decisions, budget checks, and WalletGuard validations.',
          responses: { '200': { description: 'Audit log' } }
        }
      },
      '/agent/guard': {
        get: {
          summary: 'Check WalletGuard Safety Layer',
          description: 'Shows active defense layers: rate limits, address whitelists, and per-transaction caps.',
          responses: { '200': { description: 'WalletGuard state' } }
        }
      },
      '/agent/budget': {
        get: {
          summary: 'Get Daily Budget Status',
          description: 'Fetches the current daily spending against the maximum allowance to prevent runaway costs.',
          responses: { '200': { description: 'Budget state' } }
        }
      },
      '/defi/aave': {
        get: {
          summary: 'Aave V3 — Live USDT Lending Rates',
          description: 'Fetches real-time Aave V3 reserve data for USDT including supply APY, borrow APY, total supplied, and total borrowed. Supports Ethereum, Arbitrum, and Base.',
          parameters: [{ name: 'chain', in: 'query', schema: { type: 'string', enum: ['ethereum', 'arbitrum', 'base'] }, description: 'Chain to query' }],
          responses: { '200': { description: 'Live Aave V3 USDT reserve data' } }
        }
      },
      '/defi/aave/all': {
        get: {
          summary: 'Aave V3 — Multi-Chain Overview',
          description: 'Returns Aave V3 USDT lending data across all supported chains simultaneously.',
          responses: { '200': { description: 'Multi-chain Aave data' } }
        }
      },
      '/defi/bridge/chains': {
        get: {
          summary: 'USDT0 Bridge — Supported Chains',
          description: 'Lists all 15+ chains supported by the USDT0 (LayerZero V2) cross-chain bridge.',
          responses: { '200': { description: 'Supported chain list' } }
        }
      },
      '/defi/bridge/estimate': {
        get: {
          summary: 'USDT0 Bridge — Fee Estimation',
          description: 'Estimates the bridging fee and time for USDT transfers between any two supported chains.',
          parameters: [
            { name: 'from', in: 'query', required: true, schema: { type: 'string' }, description: 'Source chain (e.g., Sonic)' },
            { name: 'to', in: 'query', required: true, schema: { type: 'string' }, description: 'Destination chain (e.g., Ethereum)' },
            { name: 'amount', in: 'query', required: true, schema: { type: 'number' }, description: 'USDT amount' }
          ],
          responses: { '200': { description: 'Bridge fee estimate' } }
        }
      }
    }
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
