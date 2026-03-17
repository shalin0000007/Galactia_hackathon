/**
 * walletService.js — Wallet Service (interfaces with WDK / blockchain)
 * 
 * Day 1: Person B builds createWallet() + getBalance() + sendUSDT() using WDK.
 * Person A creates the API layer that calls these functions.
 * 
 * This file provides a mock/stub implementation so Person A can build
 * and test the API routes independently. Person B replaces these stubs
 * with real WDK calls.
 */

const { v4: uuidv4 } = require('uuid');

// In-memory wallet store (replaced by WDK in production)
const wallets = new Map();

/**
 * Create a new wallet
 * @returns {Object} { address, name, balance }
 */
async function createWallet(name = 'Agent') {
  const address = `0x${uuidv4().replace(/-/g, '').substring(0, 40)}`;
  const wallet = {
    address,
    name,
    balance: 10.0, // Start with 10 USDT for testing
    createdAt: new Date().toISOString(),
  };
  wallets.set(address, wallet);
  console.log(`[WalletService] Created wallet: ${name} → ${address}`);
  return wallet;
}

/**
 * Get wallet balance
 * @param {string} address - Wallet address
 * @returns {Object} { address, balance, currency }
 */
async function getBalance(address) {
  const wallet = wallets.get(address);
  if (!wallet) {
    throw new Error(`Wallet not found: ${address}`);
  }
  return {
    address: wallet.address,
    name: wallet.name,
    balance: wallet.balance,
    currency: 'USDT',
  };
}

/**
 * Send USDT from one wallet to another
 * @param {string} fromAddress - Sender wallet address
 * @param {string} toAddress - Receiver wallet address
 * @param {number} amount - Amount in USDT
 * @returns {Object} { txHash, from, to, amount, timestamp }
 */
async function sendUSDT(fromAddress, toAddress, amount) {
  const fromWallet = wallets.get(fromAddress);
  const toWallet = wallets.get(toAddress);

  if (!fromWallet) throw new Error(`Sender wallet not found: ${fromAddress}`);
  if (!toWallet) throw new Error(`Receiver wallet not found: ${toAddress}`);
  if (fromWallet.balance < amount) throw new Error(`Insufficient balance: ${fromWallet.balance} USDT (need ${amount})`);
  if (amount <= 0) throw new Error('Amount must be positive');

  // Perform transfer
  fromWallet.balance -= amount;
  toWallet.balance += amount;

  const txHash = `0x${uuidv4().replace(/-/g, '')}`;
  const tx = {
    txHash,
    from: fromAddress,
    fromName: fromWallet.name,
    to: toAddress,
    toName: toWallet.name,
    amount,
    currency: 'USDT',
    timestamp: new Date().toISOString(),
    status: 'confirmed',
  };

  console.log(`[WalletService] Transfer: ${fromWallet.name} → ${toWallet.name} | ${amount} USDT | tx: ${txHash}`);
  return tx;
}

/**
 * Get all wallets
 * @returns {Array} List of all wallets
 */
async function getAllWallets() {
  return Array.from(wallets.values());
}

/**
 * Get wallet by address
 * @param {string} address
 * @returns {Object|null}
 */
async function getWallet(address) {
  return wallets.get(address) || null;
}

module.exports = {
  createWallet,
  getBalance,
  sendUSDT,
  getAllWallets,
  getWallet,
};
