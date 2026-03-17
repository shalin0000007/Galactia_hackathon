const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
// Also try parent dir if key not found
if (!process.env.OPENAI_API_KEY) {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
}
const { ChatOpenAI } = require('@langchain/openai');

async function testAgent() {
  console.log('Testing OpenAI connection...');
  console.log('API Key found:', process.env.OPENAI_API_KEY ? 'Yes (starts with ' + process.env.OPENAI_API_KEY.substring(0, 10) + '...)' : 'No');
  try {
    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    
    const response = await model.invoke("Hello! This is a test prompt to verify LangChain + OpenAI integration.");
    console.log("Agent Response:", response.content);
  } catch (error) {
    if (error.message.includes("401")) {
      console.log("OpenAI test failed: Invalid API key (401). Please check your .env file.");
    } else {
      console.error('Error during OpenAI test:', error.message);
    }
  }
}

testAgent();
