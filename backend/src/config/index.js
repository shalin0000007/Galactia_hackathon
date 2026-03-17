require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '24h',

  // AI Provider
  aiProvider: process.env.AI_PROVIDER || 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,

  // Database
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,

  // Code Execution
  judge0ApiUrl: process.env.JUDGE0_API_URL,
  judge0ApiKey: process.env.JUDGE0_API_KEY,

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Rate Limits
  rateLimits: {
    aiRequestsPerMinute: 10,
    standardRequestsPerMinute: 60,
  },

  // AI Model Settings for Agents
  ai: {
    manager: {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
    },
    research: {
      model: 'gpt-4o-mini',
      temperature: 0.4,
      maxTokens: 800,
    },
    execution: {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 500,
    },
  },
};

module.exports = config;
