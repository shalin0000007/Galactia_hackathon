require('dotenv').config();
const { ChatOpenAI } = require('@langchain/openai');

async function testAgent() {
  console.log('Testing OpenAI connection...');
  try {
    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY || "sk-dummy-key" // Dummy fallback to prevent immediate crash if not set
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
