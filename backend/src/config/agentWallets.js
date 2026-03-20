/**
 * Agent Wallet Configuration — WDK / Sonic
 *
 * Derives 3 deterministic agent wallets from the WDK seed phrase:
 *   Index 0 → Manager Agent  (holds funds, pays workers)
 *   Index 1 → Research Agent (receives payment for research tasks)
 *   Index 2 → Execution Agent (receives payment for execution tasks)
 *
 * Wallets are real on-chain addresses on the Sonic network.
 */

const walletService = require('../services/walletService');

// Agent wallet info — populated after initialization
const agentWallets = {
  manager: null,
  research: null,
  execution: null,
};

/**
 * Initialize the 3 agent wallets at server startup.
 * Derives real addresses from the WDK seed phrase.
 */
async function initAgentWallets() {
  console.log('\n🔐 Deriving agent wallets on Sonic via WDK...\n');

  // Derive accounts at fixed BIP-44 indices
  const manager = await walletService.createWallet('Manager Agent', 0);
  const research = await walletService.createWallet('Research Agent', 1);
  const execution = await walletService.createWallet('Execution Agent', 2);

  // Fetch real on-chain USDT balances
  const managerBal = await walletService.getBalance(manager.address);
  const researchBal = await walletService.getBalance(research.address);
  const executionBal = await walletService.getBalance(execution.address);

  agentWallets.manager = { ...manager, balance: managerBal.balance };
  agentWallets.research = { ...research, balance: researchBal.balance };
  agentWallets.execution = { ...execution, balance: executionBal.balance };

  console.log(`\n📋 Agent Wallets (Sonic Network):`);
  console.log(`   Manager:   ${manager.address} (${managerBal.balance} USDT)`);
  console.log(`   Research:  ${research.address} (${researchBal.balance} USDT)`);
  console.log(`   Execution: ${execution.address} (${executionBal.balance} USDT)\n`);

  return agentWallets;
}

/**
 * Get all agent wallet info (includes cached balance from init).
 */
function getAgentWallets() {
  return agentWallets;
}

module.exports = { initAgentWallets, getAgentWallets, agentWallets };
