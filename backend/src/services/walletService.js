/**
 * walletService.js — Real WDK Wallet Service (Sonic Network)
 *
 * Uses Tether WDK (@tetherto/wdk-wallet-evm) for:
 *   - Deterministic wallet derivation from BIP-39 seed phrase
 *   - Real on-chain USDT (ERC20) transfers on Sonic
 *   - Real balance queries via Sonic RPC
 *
 * Agent account indices:
 *   0 = Manager Agent
 *   1 = Research Agent
 *   2 = Execution Agent
 */

const WalletManagerEvm = require('@tetherto/wdk-wallet-evm');
const config = require('../config');
const walletGuard = require('./walletGuard');
const auditLog = require('./auditLog');

// ── Singleton WDK wallet manager ────────────────────────
let walletManager = null;

// ── In-memory account registry ──────────────────────────
// Maps address → { name, account (WalletAccountEvm), index }
const accounts = new Map();
// Maps name → address (for easy lookup by agent name)
const nameToAddress = new Map();

/**
 * Initialize the WDK WalletManagerEvm singleton.
 * Must be called before any other wallet operation.
 */
function ensureWalletManager() {
  if (walletManager) return walletManager;

  const seedPhrase = config.wdkSeedPhrase;
  if (!seedPhrase || seedPhrase.split(' ').length < 12) {
    throw new Error(
      'WDK_SEED_PHRASE is missing or invalid. Set a valid 12-word BIP-39 seed phrase in your .env file.'
    );
  }

  // WalletManagerEvm handles both default and named exports
  const Manager = WalletManagerEvm.default || WalletManagerEvm;

  walletManager = new Manager(seedPhrase, {
    provider: config.sonic.rpcUrl,
  });

  console.log(`[WalletService] WDK initialized → Sonic RPC: ${config.sonic.rpcUrl}`);
  return walletManager;
}

/**
 * Create (derive) a wallet account at a given BIP-44 index.
 * @param {string} name  — Display name (e.g. "Manager Agent")
 * @param {number} index — BIP-44 account index (0, 1, 2, …)
 * @returns {Object} { address, name, index }
 */
async function createWallet(name = 'Agent', index = 0) {
  const mgr = ensureWalletManager();
  const account = await mgr.getAccount(index);
  const address = await account.getAddress();

  // Store for later use
  accounts.set(address, { name, account, index });
  nameToAddress.set(name, address);

  // Register with WalletGuard (manager = index 0)
  const role = index === 0 ? 'manager' : 'worker';
  walletGuard.registerAgent(address, role);

  auditLog.log('wallet_created', name, { address, index, role });
  console.log(`[WalletService] Derived wallet: ${name} → ${address} (index ${index}, role: ${role})`);
  return { address, name, index, role, createdAt: new Date().toISOString() };
}

/**
 * Get the real on-chain USDT balance for a wallet address.
 * @param {string} address — Wallet address
 * @returns {Object} { address, name, balance, currency }
 */
async function getBalance(address) {
  const entry = accounts.get(address);
  if (!entry) {
    throw new Error(`Wallet not found: ${address}`);
  }

  try {
    // Query ERC20 USDT balance on Sonic
    const rawBalance = await entry.account.getTokenBalance(config.sonic.usdtContract);
    // USDT has 6 decimals — rawBalance is in base units
    const balance = Number(rawBalance) / 1e6;

    return {
      address,
      name: entry.name,
      balance,
      currency: 'USDT',
    };
  } catch (err) {
    console.error(`[WalletService] Balance check failed for ${address}: ${err.message}`);
    // Return 0 balance on error rather than crashing the system
    return {
      address,
      name: entry.name,
      balance: 0,
      currency: 'USDT',
      error: err.message,
    };
  }
}

/**
 * Send USDT (ERC20) from one agent wallet to another on Sonic.
 * @param {string} fromAddress — Sender wallet address
 * @param {string} toAddress   — Receiver wallet address
 * @param {number} amount      — Amount in USDT (human-readable, e.g. 0.5)
 * @returns {Object} { txHash, from, to, amount, currency, timestamp, status }
 */
async function sendUSDT(fromAddress, toAddress, amount) {
  const fromEntry = accounts.get(fromAddress);
  if (!fromEntry) throw new Error(`Sender wallet not found: ${fromAddress}`);
  if (!accounts.has(toAddress)) throw new Error(`Receiver wallet not found: ${toAddress}`);
  if (amount <= 0) throw new Error('Amount must be positive');

  const toEntry = accounts.get(toAddress);

  // ── WalletGuard safety check ──────────────────────────
  const guardResult = walletGuard.validateTransfer(fromAddress, toAddress, amount);
  auditLog.log('transfer_validated', fromEntry.name, {
    to: toEntry.name, amount, approved: guardResult.approved, reason: guardResult.reason,
  });

  if (!guardResult.approved) {
    auditLog.log('transfer_blocked', fromEntry.name, { reason: guardResult.reason });
    throw new Error(`WalletGuard blocked transfer: ${guardResult.reason}`);
  }

  // Convert human-readable USDT to base units (6 decimals)
  const amountBaseUnits = BigInt(Math.round(amount * 1e6));

  console.log(`[WalletService] Sending ${amount} USDT: ${fromEntry.name} → ${toEntry.name}`);

  try {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(config.sonic.rpcUrl);
    const signer = fromEntry.account._account.connect(provider);
    
    const abi = ["function transfer(address to, uint256 value) public returns (bool)"];
    const usdtContract = new ethers.Contract(config.sonic.usdtContract, abi, signer);

    const result = await usdtContract.transfer(toAddress, amountBaseUnits);
    await result.wait();

    const txHash = result.hash;
    walletGuard.recordTransfer(fromAddress, toAddress, amount);
    auditLog.log('transfer_succeeded', fromEntry.name, { to: toEntry.name, amount, txHash });
    console.log(`[WalletService] ✅ Transfer confirmed | tx: ${txHash}`);

    return {
      txHash,
      from: fromAddress,
      fromName: fromEntry.name,
      to: toAddress,
      toName: toEntry.name,
      amount,
      currency: 'USDT',
      fee: result.fee ? Number(result.fee) : null,
      timestamp: new Date().toISOString(),
      status: 'confirmed',
    };
  } catch (err) {
    auditLog.log('transfer_failed', fromEntry.name, { to: toEntry.name, amount, error: err.message });
    console.error(`[WalletService] ❌ Transfer failed: ${err.message}`);
    throw new Error(`USDT transfer failed: ${err.message}`);
  }
}

/**
 * Get all registered wallets (with on-chain balances).
 * @returns {Array} List of wallet objects
 */
async function getAllWallets() {
  const wallets = [];
  for (const [address, entry] of accounts) {
    const balanceInfo = await getBalance(address);
    wallets.push({
      address,
      name: entry.name,
      index: entry.index,
      balance: balanceInfo.balance,
      currency: 'USDT',
    });
  }
  return wallets;
}

/**
 * Get a wallet's account entry by address.
 * @param {string} address
 * @returns {Object|null}
 */
async function getWallet(address) {
  const entry = accounts.get(address);
  if (!entry) return null;
  const balanceInfo = await getBalance(address);
  return {
    address,
    name: entry.name,
    index: entry.index,
    balance: balanceInfo.balance,
    currency: 'USDT',
  };
}

/**
 * Get the WalletAccountEvm instance for an address (used internally).
 */
function getAccountInstance(address) {
  const entry = accounts.get(address);
  return entry ? entry.account : null;
}

module.exports = {
  createWallet,
  getBalance,
  sendUSDT,
  getAllWallets,
  getWallet,
  getAccountInstance,
  ensureWalletManager,
};
