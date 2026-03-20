const { ethers } = require('ethers');
require('dotenv').config();

const mnemonic = process.env.WDK_SEED_PHRASE;
const targetAddress = "0x418c688B62C7D4acA0f50264834951db71AB7a85".toLowerCase();

console.log("Searching for derivation path for:", targetAddress);

const coinTypes = [60, 146, 0, 1, 1004]; // Common EVM coin types and Sonic

for (let c of coinTypes) {
  for (let account = 0; account < 5; account++) {
    for (let change = 0; change < 2; change++) {
      for (let index = 0; index < 5; index++) {
        const path = `m/44'/${c}'/${account}'/${change}/${index}`;
        try {
          const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, path);
          if (wallet.address.toLowerCase() === targetAddress) {
            console.log("✅ Found exact match!");
            console.log("Path:", path);
            console.log("Private Key:", wallet.privateKey);
            process.exit(0);
          }
        } catch(e) {}
      }
    }
  }
}

console.log("Not found in standard paths. Trying WDK default which might be index only...");
// Maybe m/44'/60'/0'/0/x
for (let i = 0; i < 20; i++) {
   let path = `m/44'/60'/0'/0/${i}`;
   let wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, path);
   if (wallet.address.toLowerCase() === targetAddress) console.log("Match:", path, wallet.privateKey);
}
// Try tether's coin type ?
