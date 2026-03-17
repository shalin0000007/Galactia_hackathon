/**
 * Agent Wallet Configuration
 * 
 * Stores the 3 agent wallet addresses created on Day 1.
 * These are populated at server startup via initAgentWallets().
 */

const walletService = require('../services/walletService');

// Agent wallet addresses — populated after initialization
const agentWallets = {
  manager: null,
  research: null,
  execution: null,
};

/**
 * Initialize the 3 agent wallets at server startup
 * Creates: Manager, Research, and Execution agent wallets
 */
async function initAgentWallets() {
  console.log('\n🔐 Creating agent wallets...\n');

  const manager = await walletService.createWallet('Manager Agent');
  const research = await walletService.createWallet('Research Agent');
  const execution = await walletService.createWallet('Execution Agent');

  agentWallets.manager = manager;
  agentWallets.research = research;
  agentWallets.execution = execution;

  console.log(`\n📋 Agent Wallets Created:`);
  console.log(`   Manager:   ${manager.address} (${manager.balance} USDT)`);
  console.log(`   Research:  ${research.address} (${research.balance} USDT)`);
  console.log(`   Execution: ${execution.address} (${execution.balance} USDT)\n`);

  return agentWallets;
}

/**
 * Get all agent wallet info
 */
function getAgentWallets() {
  return agentWallets;
}

module.exports = { initAgentWallets, getAgentWallets, agentWallets };
