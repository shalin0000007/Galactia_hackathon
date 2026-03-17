const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createWallet } = require('./walletService');

const delay = ms => new Promise(res => setTimeout(res, ms));

async function setup() {
  console.log("Setting up Agent Wallets...");
  
  const roles = ['Manager', 'Research', 'Execution'];
  const config = {};
  
  for (const role of roles) {
    const result = await createWallet(role);
    config[role] = result.address;
    console.log(`Waiting 2s after creating ${role}...`);
    await delay(2000); // 2 second delay
  }
  
  const configContent = `// Agent Wallet Configuration
module.exports = {
  wallets: ${JSON.stringify(config, null, 2)}
};
`;

  fs.writeFileSync(path.join(__dirname, 'config.js'), configContent);
  console.log("Agent wallets setup complete! Saved to config.js.");
  console.log(config);
}

setup();
