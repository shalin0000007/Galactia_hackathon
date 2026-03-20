const walletService = require('./src/services/walletService');

async function test() {
  const account = await walletService.createWallet('Manager Agent', 0);
  const instance = walletService.getAccountInstance(account.address);
  
  if (instance._account && instance._account.privateKey) {
     console.log("Found PK in _account:", instance._account.privateKey);
  } else {
     console.log("Keys of _account:", Object.keys(instance._account));
     console.dir(instance._account, {depth: 2});
  }
  process.exit(0);
}
test();
