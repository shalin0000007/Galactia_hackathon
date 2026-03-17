/**
 * Full Test Suite — Day 1 + Day 2 + Day 3 Verification
 * 
 * Day 1: Wallet System
 *   ✓ GET /health
 *   ✓ GET /agents — 3 agent wallets (Manager, Research, Execution)
 *   ✓ POST /wallet/create
 *   ✓ GET /wallet/balance/:addr
 *   ✓ POST /wallet/send — USDT transfer
 *   ✓ GET /wallet/all
 * 
 * Day 2: AI Agent System
 *   ✓ GET /agent/status
 *   ✓ POST /agent/run — full manager → router → workers chain
 *   ✓ Validation (empty/missing prompt)
 * 
 * Day 3: Payment System
 *   ✓ GET /payments — in-memory + persisted
 *   ✓ GET /payments/stats — totals by agent
 *   ✓ GET /payments/:id — lookup + explorer URL (Person B)
 *   ✓ payments.json — DB persistence (Person B)
 *   ✓ explorer_url in agent run result (Person B)
 *   ✓ dbService.js — read from file
 */

const fs = require('fs');
const path = require('path');
const BASE = 'http://localhost:3000';

async function request(method, endpoint, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${endpoint}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

let passed = 0, failed = 0, total = 0;

function check(name, condition, reason = '') {
  total++;
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}${reason ? ' — ' + reason : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n' + '═'.repeat(62));
  console.log('  🧪 AgentPay — Full Test Suite (Day 1 + Day 2 + Day 3)');
  console.log('═'.repeat(62));

  // ─────────────────────────────────────────────
  //  DAY 1: Wallet System
  // ─────────────────────────────────────────────
  console.log('\n📅 DAY 1 — Wallet System');
  console.log('─'.repeat(40));

  const health = await request('GET', '/health');
  check('GET /health → status ok', health.data.status === 'ok');
  check('GET /health → service name correct', health.data.service === 'AgentPay Backend');

  const agents = await request('GET', '/agents');
  check('GET /agents → success', agents.data.success === true);
  check('Manager Agent wallet exists', !!agents.data.agents?.manager?.address);
  check('Research Agent wallet exists', !!agents.data.agents?.research?.address);
  check('Execution Agent wallet exists', !!agents.data.agents?.execution?.address);
  check('Manager starts with 10 USDT', agents.data.agents?.manager?.balance === 10);

  const newWallet = await request('POST', '/wallet/create', { name: 'Test Wallet' });
  check('POST /wallet/create → success', newWallet.data.success === true, JSON.stringify(newWallet.data.error || ''));
  const testAddr = newWallet.data.wallet?.address;
  check('New wallet has address', !!testAddr);

  if (testAddr) {
    const bal = await request('GET', `/wallet/balance/${testAddr}`);
    check('GET /wallet/balance → 200', bal.status === 200);
  }

  const managerAddr = agents.data.agents?.manager?.address;
  const researchAddr = agents.data.agents?.research?.address;
  if (managerAddr && researchAddr) {
    const send = await request('POST', '/wallet/send', { from: managerAddr, to: researchAddr, amount: 0.5 });
    check('POST /wallet/send → success', send.data.success === true, JSON.stringify(send.data.error || ''));
    check('POST /wallet/send → has txHash', !!send.data.transaction?.txHash);
  }

  const allWallets = await request('GET', '/wallet/all');
  check('GET /wallet/all → success', allWallets.data.success === true);
  check('GET /wallet/all → 4+ wallets', (allWallets.data.wallets?.length || 0) >= 4, `count=${allWallets.data.wallets?.length}`);

  // ─────────────────────────────────────────────
  //  DAY 2: AI Agent System
  // ─────────────────────────────────────────────
  console.log('\n📅 DAY 2 — AI Agent System');
  console.log('─'.repeat(40));

  const agentStatus = await request('GET', '/agent/status');
  check('GET /agent/status → success', agentStatus.data.success === true);
  check('GET /agent/status → has manager', !!agentStatus.data.agents?.manager);
  check('GET /agent/status → has research', !!agentStatus.data.agents?.research);
  check('GET /agent/status → has execution', !!agentStatus.data.agents?.execution);

  console.log('\n  ⏳ Running full agent chain (POST /agent/run) — ~5s...');
  const agentRun = await request('POST', '/agent/run', { prompt: 'Find the best cryptocurrency to invest in' });
  check('POST /agent/run → success', agentRun.data.success === true, agentRun.data.error?.message || '');
  check('POST /agent/run → has manager_reasoning', !!agentRun.data.manager_reasoning);
  check('POST /agent/run → tasks_assigned > 0', (agentRun.data.tasks_assigned || 0) > 0);
  check('POST /agent/run → results array exists', Array.isArray(agentRun.data.results));

  if (Array.isArray(agentRun.data.results) && agentRun.data.results.length > 0) {
    const done = agentRun.data.results.filter(r => r.status === 'completed');
    const paid = agentRun.data.results.filter(r => r.payment?.status === 'paid');
    check('At least 1 task completed', done.length > 0, `completed=${done.length}`);
    check('At least 1 USDT payment made', paid.length > 0, `paid=${paid.length}`);
  }

  check('POST /agent/run → trace.total_tasks > 0', (agentRun.data.trace?.total_tasks || 0) > 0);
  check('POST /agent/run → trace.total_payment > 0', (agentRun.data.trace?.total_payment || 0) > 0);
  check('POST /agent/run → trace.total_duration_ms > 0', (agentRun.data.trace?.total_duration_ms || 0) > 0);

  const emptyPrompt = await request('POST', '/agent/run', { prompt: '' });
  check('POST /agent/run empty prompt → 400', emptyPrompt.status === 400, `status=${emptyPrompt.status}`);
  const noPrompt = await request('POST', '/agent/run', {});
  check('POST /agent/run no prompt → 400', noPrompt.status === 400, `status=${noPrompt.status}`);

  // ─────────────────────────────────────────────
  //  DAY 3: Payment System
  // ─────────────────────────────────────────────
  console.log('\n📅 DAY 3 — Payment System');
  console.log('─'.repeat(40));

  // GET /payments
  const payments = await request('GET', '/payments');
  check('GET /payments → success', payments.data.success === true);
  check('GET /payments → has payments array (in-memory)', Array.isArray(payments.data.payments));
  check('GET /payments → has persisted section (Person B dbService)', !!payments.data.persisted);
  check('GET /payments → persisted has count', typeof payments.data.persisted?.count === 'number');

  // After agent run, in-memory should have entries
  check('GET /payments → in-memory count > 0 (agent run recorded payment)', (payments.data.count || 0) > 0, `count=${payments.data.count}`);

  // GET /payments/stats
  const stats = await request('GET', '/payments/stats');
  check('GET /payments/stats → success', stats.data.success === true);
  check('GET /payments/stats → totalPayments > 0', (stats.data.totalPayments || 0) > 0, `total=${stats.data.totalPayments}`);
  check('GET /payments/stats → totalAmount > 0', (stats.data.totalAmount || 0) > 0, `amount=${stats.data.totalAmount}`);
  check('GET /payments/stats → byAgent.research exists', !!stats.data.byAgent?.research);
  check('GET /payments/stats → byAgent.execution exists', !!stats.data.byAgent?.execution);

  // GET /payments/:id with explorer URL (Person B)
  const firstPayment = payments.data.payments?.[0];
  if (firstPayment?.txHash) {
    const singlePayment = await request('GET', `/payments/${firstPayment.txHash}`);
    check('GET /payments/:id → found by txHash', singlePayment.data.success === true, `status=${singlePayment.status}`);
    check('GET /payments/:id → has explorer_url (Person B)', !!singlePayment.data.payment?.explorer_url, 'missing explorer_url');
    check('GET /payments/:id → explorer_url is sonicscan', singlePayment.data.payment?.explorer_url?.includes('sonicscan'), singlePayment.data.payment?.explorer_url);
  }

  // explorer_url in agent run results (Person B)
  const paidResult = agentRun.data.results?.find(r => r.payment?.status === 'paid');
  check('POST /agent/run result → explorer_url present (Person B)', !!paidResult?.payment?.explorer_url, 'no explorer_url in paid result');
  check('POST /agent/run result → explorer_url is sonicscan', paidResult?.payment?.explorer_url?.includes('sonicscan'), paidResult?.payment?.explorer_url);

  // payments.json persistence (Person B dbService)
  const DB_PATH = path.join(__dirname, 'payments.json');
  const dbExists = fs.existsSync(DB_PATH);
  check('payments.json file exists (Person B dbService)', dbExists);
  if (dbExists) {
    const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    check('payments.json has records', Array.isArray(dbData) && dbData.length > 0, `count=${dbData.length}`);
    check('payments.json record has tx_hash', !!dbData[dbData.length - 1]?.tx_hash);
    check('payments.json record has timestamp', !!dbData[dbData.length - 1]?.timestamp);
    check('payments.json record has agent_name', !!dbData[dbData.length - 1]?.agent_name);
  }

  // GET /payments?agentType filter
  const filtered = await request('GET', '/payments?agentType=research');
  check('GET /payments?agentType=research → success', filtered.data.success === true);

  // 404 for unknown payment
  const notFound = await request('GET', '/payments/0xdeadbeef999');
  check('GET /payments/unknown → 404', notFound.status === 404, `status=${notFound.status}`);

  // ─────────────────────────────────────────────
  //  SUMMARY
  // ─────────────────────────────────────────────
  console.log('\n' + '═'.repeat(62));
  const pct = Math.round((passed / total) * 100);
  console.log(`  📊 Results: ${passed}/${total} passed (${pct}%) — ${failed} failed`);
  if (failed === 0) {
    console.log('  🎉 ALL TESTS PASSED! Day 1 + Day 2 + Day 3 verified ✅');
  } else {
    console.log(`  ⚠️  ${failed} test(s) failed`);
  }
  console.log('═'.repeat(62) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('\nTest suite crashed:', err.message);
  process.exit(1);
});
