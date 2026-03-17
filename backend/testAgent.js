/**
 * testAgent.js — Test LangChain + OpenAI integration
 * 
 * Run: node testAgent.js
 * Goal: Send a prompt to OpenAI via LangChain, log the response.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
// Fallback: try parent dir if key not found
if (!process.env.OPENAI_API_KEY) {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
}

const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

async function testAgent() {
  console.log('\n🧠 Testing LangChain + OpenAI connection...\n');
  console.log('API Key found:', process.env.OPENAI_API_KEY ? 'Yes (starts with ' + process.env.OPENAI_API_KEY.substring(0, 10) + '...)' : 'No');

  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Test 1: Simple prompt
    console.log('\n--- Test 1: Simple Prompt ---');
    const response1 = await model.invoke([
      new SystemMessage('You are a helpful AI assistant for a payment system called AgentPay.'),
      new HumanMessage('What is AgentPay and how can AI agents make payments to each other?'),
    ]);
    console.log('Response:', response1.content);

    // Test 2: Manager Agent task assignment
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
    if (error.message.includes('401')) {
      console.error('\n❌ Invalid API key (401). Please check your .env file.');
    } else {
      console.error('\n❌ Error:', error.message);
    }
    if (error.message.includes('API key') || error.message.includes('401')) {
      console.error('💡 Make sure OPENAI_API_KEY is set in your .env file');
    }
    process.exit(1);
  }
}

testAgent();
