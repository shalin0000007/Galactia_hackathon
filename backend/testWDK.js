/**
 * testWDK.js — WDK Wallet Integration Verification
 *
 * Tests that the WDK wallet service correctly:
 *   1. Initializes with the seed phrase from .env
 *   2. Derives real Ethereum-style addresses for agents
 *   3. Queries real USDT balances on Sonic
 *   4. (Optional) Sends a real USDT transfer if funded
 *
 * Usage:  node testWDK.js
 */

require('dotenv').config();

const config = require('./src/config');
const walletService = require('./src/services/walletService');

let passed = 0, failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n' + '═'.repeat(60));
  console.log('  🔬  WDK + Sonic Integration Test');
  console.log('═'.repeat(60));

  // ── Configuration ────────────────────────
  console.log('\n📋 Configuration');
  console.log('─'.repeat(40));
  check('WDK_SEED_PHRASE is set', !!config.wdkSeedPhrase && config.wdkSeedPhrase.split(' ').length >= 12,
    `got ${config.wdkSeedPhrase ? config.wdkSeedPhrase.split(' ').length : 0} words`);
  check('Sonic RPC URL configured', !!config.sonic.rpcUrl, config.sonic.rpcUrl);
  check('USDT contract configured', !!config.sonic.usdtContract, config.sonic.usdtContract);
  console.log(`   RPC:  ${config.sonic.rpcUrl}`);
  console.log(`   USDT: ${config.sonic.usdtContract}`);

  if (!config.wdkSeedPhrase || config.wdkSeedPhrase.split(' ').length < 12) {
    console.log('\n⛔ Cannot proceed — WDK_SEED_PHRASE not set in .env');
    console.log('   Set: WDK_SEED_PHRASE=your twelve word seed phrase here');
    process.exit(1);
  }

  // ── Wallet Derivation ────────────────────
  console.log('\n🔐 Wallet Derivation');
  console.log('─'.repeat(40));

  const manager = await walletService.createWallet('Manager Agent', 0);
  check('Manager wallet derived', !!manager.address);
  check('Manager address is 0x hex', /^0x[0-9a-fA-F]{40}$/.test(manager.address), manager.address);
  console.log(`   Manager:   ${manager.address}`);

  const research = await walletService.createWallet('Research Agent', 1);
  check('Research wallet derived', !!research.address);
  check('Research address is 0x hex', /^0x[0-9a-fA-F]{40}$/.test(research.address), research.address);
  console.log(`   Research:  ${research.address}`);

  const execution = await walletService.createWallet('Execution Agent', 2);
  check('Execution wallet derived', !!execution.address);
  check('Execution address is 0x hex', /^0x[0-9a-fA-F]{40}$/.test(execution.address), execution.address);
  console.log(`   Execution: ${execution.address}`);

  check('All addresses are different',
    manager.address !== research.address && research.address !== execution.address);

  // Determinism test — same index should give same address
  const manager2 = await walletService.createWallet('Manager Agent 2', 0);
  check('Deterministic (same index → same address)', manager.address === manager2.address);

  // ── Balance Queries ──────────────────────
  console.log('\n💰 On-Chain Balance Queries (Sonic)');
  console.log('─'.repeat(40));

  const mBal = await walletService.getBalance(manager.address);
  check('Manager balance query succeeds', mBal !== null && mBal.balance !== undefined);
  console.log(`   Manager USDT balance: ${mBal.balance}`);

  const rBal = await walletService.getBalance(research.address);
  check('Research balance query succeeds', rBal !== null && rBal.balance !== undefined);
  console.log(`   Research USDT balance: ${rBal.balance}`);

  const eBal = await walletService.getBalance(execution.address);
  check('Execution balance query succeeds', eBal !== null && eBal.balance !== undefined);
  console.log(`   Execution USDT balance: ${eBal.balance}`);

  // ── Transfer Test (only if funded) ───────
  console.log('\n📤 Transfer Test');
  console.log('─'.repeat(40));

  if (mBal.balance >= 0.01) {
    console.log('  ⏳ Sending 0.01 USDT from Manager → Research...');
    try {
      const tx = await walletService.sendUSDT(manager.address, research.address, 0.01);
      check('Transfer succeeded', !!tx.txHash);
      check('Real tx hash (64 hex chars)', /^0x[0-9a-fA-F]{64}$/.test(tx.txHash), tx.txHash);
      console.log(`   Tx Hash: ${tx.txHash}`);
      console.log(`   Explorer: ${config.sonic.explorerUrl}/tx/${tx.txHash}`);
    } catch (err) {
      check('Transfer succeeded', false, err.message);
    }
  } else {
    console.log('  ⏭️  Skipping transfer — Manager has insufficient USDT balance');
    console.log(`     Current balance: ${mBal.balance} USDT (need ≥ 0.01)`);
    console.log(`     Fund this address with USDT on Sonic: ${manager.address}`);
  }

  // ── Summary ──────────────────────────────
  console.log('\n' + '═'.repeat(60));
  const total = passed + failed;
  const pct = Math.round((passed / total) * 100);
  console.log(`  📊 Results: ${passed}/${total} passed (${pct}%) — ${failed} failed`);
  if (failed === 0) {
    console.log('  🎉 ALL WDK TESTS PASSED! ✅');
  } else {
    console.log(`  ⚠️  ${failed} test(s) failed`);
  }
  console.log('═'.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('\n💥 Test suite crashed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
