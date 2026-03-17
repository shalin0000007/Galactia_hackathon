/**
 * Full Test Suite — Day 1 + Day 2 Verification
 * 
 * Tests all endpoints from both days against the schedule:
 * 
 * Day 1: Wallet System
 *   ✓ GET /health — server running
 *   ✓ POST /wallet/create — create wallet
 *   ✓ GET /wallet/balance/:addr — check balance
 *   ✓ POST /wallet/send — transfer USDT
 *   ✓ GET /wallet/all — list all wallets
 *   ✓ GET /agents — 3 agent wallets (Manager, Research, Execution)
 * 
 * Day 2: AI Agent System
 *   ✓ GET /agent/status — agent wallet info
 *   ✓ POST /agent/run — full agent chain (Manager → Router → Workers)
 */

const BASE = 'http://localhost:3000';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

function pass(test) { console.log(`  ✅ ${test}`); }
function fail(test, reason) { console.log(`  ❌ ${test} — ${reason}`); }

async function runTests() {
  let passed = 0, failed = 0, total = 0;

  function check(name, condition, reason = '') {
    total++;
    if (condition) { pass(name); passed++; }
    else { fail(name, reason); failed++; }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  🧪 AgentPay — Full Test Suite (Day 1 + Day 2)');
  console.log('═'.repeat(60));

  // ============================================================
  //  DAY 1: Wallet System
  // ============================================================
  console.log('\n📅 DAY 1 — Wallet System');
  console.log('─'.repeat(40));

  // Test 1: Health check
  const health = await request('GET', '/health');
  check('GET /health returns ok', health.data.status === 'ok', `got ${health.data.status}`);
  check('Service name is AgentPay', health.data.service === 'AgentPay Backend', `got ${health.data.service}`);

  // Test 2: Agent wallets exist (auto-created on startup)
  const agents = await request('GET', '/agents');
  check('GET /agents returns success', agents.data.success === true);
  check('Manager wallet exists', agents.data.agents?.manager !== null, 'manager is null');
  check('Research wallet exists', agents.data.agents?.research !== null, 'research is null');
  check('Execution wallet exists', agents.data.agents?.execution !== null, 'execution is null');
  check('Manager has 10 USDT', agents.data.agents?.manager?.balance === 10, `balance: ${agents.data.agents?.manager?.balance}`);

  // Test 3: Create a new wallet
  const newWallet = await request('POST', '/wallet/create', { name: 'Test Wallet' });
  check('POST /wallet/create succeeds', newWallet.data.success === true, JSON.stringify(newWallet.data));
  const testAddr = newWallet.data.wallet?.address;
  check('New wallet has an address', !!testAddr, 'no address returned');

  // Test 4: Get balance
  if (testAddr) {
    const balance = await request('GET', `/wallet/balance/${testAddr}`);
    check('GET /wallet/balance returns data', balance.status === 200, `status ${balance.status}`);
  }

  // Test 5: Send USDT
  const managerAddr = agents.data.agents?.manager?.address;
  const researchAddr = agents.data.agents?.research?.address;
  if (managerAddr && researchAddr) {
    const send = await request('POST', '/wallet/send', {
      from: managerAddr,
      to: researchAddr,
      amount: 1.0,
    });
    check('POST /wallet/send succeeds', send.data.success === true, JSON.stringify(send.data));
    check('Send returns txHash', !!send.data.transaction?.txHash, 'no txHash');
  }

  // Test 6: List all wallets
  const allWallets = await request('GET', '/wallet/all');
  check('GET /wallet/all returns wallets', allWallets.data.success === true);
  check('At least 4 wallets exist', allWallets.data.wallets?.length >= 4, `count: ${allWallets.data.wallets?.length}`);

  // ============================================================
  //  DAY 2: AI Agent System
  // ============================================================
  console.log('\n📅 DAY 2 — AI Agent System');
  console.log('─'.repeat(40));

  // Test 7: Agent status
  const agentStatus = await request('GET', '/agent/status');
  check('GET /agent/status returns success', agentStatus.data.success === true);
  check('Agent status has manager', !!agentStatus.data.agents?.manager);
  check('Agent status has research', !!agentStatus.data.agents?.research);
  check('Agent status has execution', !!agentStatus.data.agents?.execution);

  // Test 8: Agent run — full chain
  console.log('\n  ⏳ Running full agent chain (may take ~5s)...');
  const agentRun = await request('POST', '/agent/run', {
    prompt: 'Find the best cryptocurrency to invest in right now',
  });
  check('POST /agent/run returns success', agentRun.data.success === true, agentRun.data.error?.message || '');
  check('Manager reasoning provided', !!agentRun.data.manager_reasoning, 'no reasoning');
  check('Tasks were assigned', agentRun.data.tasks_assigned > 0, `tasks: ${agentRun.data.tasks_assigned}`);
  check('Results returned', agentRun.data.results?.length > 0, 'no results');
  
  // Check individual results
  if (agentRun.data.results?.length > 0) {
    const completedTasks = agentRun.data.results.filter(r => r.status === 'completed');
    check('At least 1 task completed', completedTasks.length > 0, `completed: ${completedTasks.length}`);
    
    const paidTasks = agentRun.data.results.filter(r => r.payment?.status === 'paid');
    check('USDT payments made to agents', paidTasks.length > 0, `paid: ${paidTasks.length}`);
  }

  // Check trace info
  check('Trace has total_tasks', agentRun.data.trace?.total_tasks > 0);
  check('Trace has total_payment', agentRun.data.trace?.total_payment > 0, `payment: ${agentRun.data.trace?.total_payment}`);
  check('Trace has duration_ms', agentRun.data.trace?.total_duration_ms > 0);

  // Check wallet balances updated
  check('Wallet balances returned', !!agentRun.data.wallet_balances);

  // Test 9: Validation — empty prompt
  const emptyPrompt = await request('POST', '/agent/run', { prompt: '' });
  check('Empty prompt rejected (400)', emptyPrompt.status === 400, `status: ${emptyPrompt.status}`);

  // Test 10: Validation — missing prompt
  const noPrompt = await request('POST', '/agent/run', {});
  check('Missing prompt rejected (400)', noPrompt.status === 400, `status: ${noPrompt.status}`);

  // ============================================================
  //  SUMMARY
  // ============================================================
  console.log('\n' + '═'.repeat(60));
  console.log(`  📊 Results: ${passed}/${total} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('  🎉 ALL TESTS PASSED!');
  } else {
    console.log(`  ⚠️  ${failed} test(s) failed — review above`);
  }
  console.log('═'.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite crashed:', err.message);
  process.exit(1);
});
