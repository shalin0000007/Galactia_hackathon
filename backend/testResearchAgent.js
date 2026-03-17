/**
 * testResearchAgent.js — Prompt Tuning & Validation (Day 2, Person B)
 *
 * Run:  node testResearchAgent.js
 *
 * Runs 3 scenarios through the ResearchAgent and prints structured output
 * so you can iterate on the system prompt until output quality is solid.
 */

require('dotenv').config();
const { initAgentWallets } = require('./src/config/agentWallets');
const ResearchAgent = require('./src/agents/researchAgent');

const SCENARIOS = [
  {
    title: 'Scenario 1 — Analyze top 5 cryptocurrencies',
    prompt: 'Analyze the top 5 cryptocurrencies by market cap. Compare their recent performance, technology, and investment potential.',
  },
  {
    title: 'Scenario 2 — Collect Ethereum gas fee data',
    prompt: 'Collect data on Ethereum gas fees trends over the past month. Include average fees, peak times, and comparison with Layer 2 solutions.',
  },
  {
    title: 'Scenario 3 — Research DeFi lending protocols',
    prompt: 'Research the top DeFi lending protocols. Compare their TVL, interest rates, security track record, and supported assets.',
  },
];

async function runTests() {
  console.log('\n🔬 Research Agent — Prompt Tuning Test Suite\n');
  console.log('='.repeat(60));

  // Initialise wallets so the agent can link to its wallet
  await initAgentWallets();

  const agent = new ResearchAgent();

  // Print agent info
  const info = agent.getInfo();
  console.log('\n📋 Agent Info:');
  console.log(`   Name:         ${info.name}`);
  console.log(`   Role:         ${info.role}`);
  console.log(`   Wallet:       ${info.walletAddress}`);
  console.log(`   Capabilities: ${info.capabilities.join(', ')}`);
  console.log('');

  let passed = 0;

  for (const scenario of SCENARIOS) {
    console.log(`\n${'—'.repeat(60)}`);
    console.log(`🧪 ${scenario.title}`);
    console.log(`   Prompt: "${scenario.prompt}"`);
    console.log(`${'—'.repeat(60)}\n`);

    const result = await agent.execute(scenario.prompt);

    // Quality checks
    const isSuccess = result.status === 'completed';
    const isJSON = typeof result.result === 'object' && result.result !== null;
    const hasStructure =
      isJSON &&
      result.result.summary &&
      Array.isArray(result.result.data) &&
      result.result.data.length > 0;

    console.log(`   Status:     ${isSuccess ? '✅' : '❌'} ${result.status}`);
    console.log(`   Duration:   ${result.durationMs}ms`);
    console.log(`   Task Type:  ${result.taskType}`);
    console.log(`   JSON Parse: ${isJSON ? '✅ valid JSON' : '❌ raw text'}`);
    console.log(`   Structure:  ${hasStructure ? '✅ has summary + data array' : '⚠️  missing expected fields'}`);

    if (isJSON) {
      console.log(`\n   📄 Result Preview:`);
      console.log(JSON.stringify(result.result, null, 2).split('\n').map(l => `      ${l}`).join('\n'));
    } else {
      console.log(`\n   📄 Raw Output (first 300 chars):`);
      console.log(`      ${String(result.result).substring(0, 300)}`);
    }

    if (isSuccess && isJSON && hasStructure) {
      passed++;
      console.log(`\n   ✅ SCENARIO PASSED`);
    } else {
      console.log(`\n   ⚠️  SCENARIO NEEDS PROMPT TUNING`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`\n📊 Results: ${passed}/${SCENARIOS.length} scenarios produced valid structured JSON`);

  if (passed === SCENARIOS.length) {
    console.log('🎉 All scenarios passed — prompts are good!\n');
  } else {
    console.log('🔧 Some scenarios need prompt adjustments. Review the output above.\n');
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err.message);
  if (err.message.includes('API key') || err.message.includes('apiKey')) {
    console.error('💡 Make sure GROQ_API_KEY is set in your .env file');
  }
  process.exit(1);
});
