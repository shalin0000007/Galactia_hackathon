const { ChatOpenAI } = require('@langchain/openai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

class AIService {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.AI_MODEL || 'gpt-3.5-turbo',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    this.autocompleteModel = new ChatOpenAI({
      modelName: process.env.AI_MODEL || 'gpt-3.5-turbo',
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateCode({ prompt, fileContent, language }) {
    console.log(`Generating code for ${language}...`);
    const systemPrompt = `You are an expert ${language} developer. Generate code based on the user's instructions.
    Current file context:
    \`\`\`${language}
    ${fileContent || '// Empty file'}
    \`\`\`
    
    ONLY return the code inside a code block. Provide a brief explanation.`;

    const response = await this.model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]);

    return {
      code: response.content,
      language: language,
      timestamp: new Date().toISOString()
    };
  }

  async getAutoComplete({ partialCode, language }) {
    console.log(`Getting autocomplete for ${language}...`);
    const systemPrompt = `You are a code completion engine. Continue the following ${language} code snippets accurately.
    ONLY return the code completion text, no explanation.
    
    Code:
    ${partialCode}`;

    const response = await this.autocompleteModel.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: "Complete this code." }
    ]);

    return {
      suggestion: response.content,
      language: language,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new AIService();
