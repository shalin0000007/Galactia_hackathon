/**
 * testAgent.js — Day 1 Task: Test LangChain + OpenAI integration
 * 
 * Run: node testAgent.js
 * Goal: Send a prompt to OpenAI via LangChain, log the response.
 */

require('dotenv').config();
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

async function testOpenAI() {
  console.log('\n🧠 Testing LangChain + OpenAI connection...\n');

  // Initialize the model
  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Test 1: Simple prompt
    console.log('--- Test 1: Simple Prompt ---');
    const response1 = await model.invoke([
      new SystemMessage('You are a helpful AI assistant for a payment system called AgentPay.'),
      new HumanMessage('What is AgentPay and how can AI agents make payments to each other?'),
    ]);
    console.log('Response:', response1.content);
    console.log('Tokens used:', response1.usage_metadata);

    // Test 2: Task assignment prompt (simulating Manager Agent)
    console.log('\n--- Test 2: Manager Agent Task Assignment ---');
    const response2 = await model.invoke([
      new SystemMessage(
        'You are the Manager Agent in AgentPay. Your job is to receive user requests, ' +
        'break them into sub-tasks, and assign them to worker agents (Research Agent or Execution Agent). ' +
        'Return a JSON object with: { "tasks": [{ "agent": "research|execution", "task": "description", "payment": 0.5 }] }'
      ),
      new HumanMessage('Find the best cryptocurrency to invest in right now and execute a small trade.'),
    ]);
    console.log('Response:', response2.content);

    console.log('\n✅ LangChain + OpenAI connection verified successfully!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('API key')) {
      console.error('💡 Make sure OPENAI_API_KEY is set in your .env file');
    }
    process.exit(1);
  }
}

testOpenAI();
