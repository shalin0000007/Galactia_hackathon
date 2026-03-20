require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '24h',

  // AI Provider
  aiProvider: process.env.AI_PROVIDER || 'groq',
  openaiApiKey: process.env.OPENAI_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,

  // Database
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,

  // Code Execution
  judge0ApiUrl: process.env.JUDGE0_API_URL,
  judge0ApiKey: process.env.JUDGE0_API_KEY,

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',

  // WDK — Tether Wallet Development Kit
  wdkSeedPhrase: process.env.WDK_SEED_PHRASE || '',

  // Sonic Network Configuration (Blaze Testnet)
  sonic: {
    rpcUrl: process.env.SONIC_RPC_URL || 'https://rpc.blaze.soniclabs.com',
    chainId: 57054,
    usdtContract: process.env.USDT_CONTRACT_ADDRESS || '0x02EB358F508707FE091756135e5890207b01DC49', // Mock USDT deployed by Manager
    explorerUrl: 'https://testnet.sonicscan.org',
  },

  // Rate Limits
  rateLimits: {
    aiRequestsPerMinute: 10,
    standardRequestsPerMinute: 60,
  },

  // AI Model Settings for Agents (using Groq-hosted models)
  ai: {
    manager: {
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      maxTokens: 1000,
    },
    research: {
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      maxTokens: 800,
    },
    execution: {
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      maxTokens: 500,
    },
  },
};

module.exports = config;
