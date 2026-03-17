const fs = require('fs');
const path = require('path');
const { createWallet } = require('./walletService');

async function setup() {
  console.log("Setting up Agent Wallets...");
  
  const roles = ['Manager', 'Research', 'Execution'];
  const config = {};
  
  for (const role of roles) {
    const result = await createWallet(role);
    config[role] = result.address;
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
