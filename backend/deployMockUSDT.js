const fs = require('fs');
const solc = require('solc');
const { ethers } = require('ethers');
require('dotenv').config();

async function deploy() {
  console.log("Compiling MockUSDT.sol...");
  const source = fs.readFileSync('MockUSDT.sol', 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'MockUSDT.sol': {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contract = output.contracts['MockUSDT.sol']['MockUSDT'];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  // Prepare using WDK natively to get the EXACT wallet object
  const walletService = require('./src/services/walletService');
  const account = await walletService.createWallet('Manager Agent', 0);
  const instance = walletService.getAccountInstance(account.address);

  // WDK's instance._account is an Ethers HDNodeWallet
  const wallet = instance._account;

  console.log(`\nManager Wallet Address: ${wallet.address}`);
  
  const rpcUrl = 'https://rpc.blaze.soniclabs.com';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Re-connect the wallet to our provider (if WDK's provider is different)
  const signer = wallet.connect(provider);

  const balance = await provider.getBalance(signer.address);
  console.log(`Test S Balance: ${ethers.formatEther(balance)} S`);

  if (balance === 0n) {
    console.error("No S tokens for gas.");
    process.exit(1);
  }

  console.log("\nDeploying Mock USDT Contract via Ethers Signer...");
  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const initialSupply = 100000;
  
  try {
    const deployTx = await factory.deploy(initialSupply);
    console.log(`Transaction Hash: ${deployTx.deploymentTransaction().hash}`);
    console.log("Waiting for confirmation (look up the hash on sonicscan)...");
    
    await deployTx.waitForDeployment();
    const address = await deployTx.getAddress();
    
    console.log(`\n✅ Mock USDT successfully deployed at: ${address}`);
    console.log(`\nNext step: Update backend/src/config/index.js usdtContract to "${address}"`);
    console.log(`Explore it at: https://testnet.sonicscan.org/address/${address}`);
    process.exit(0);
  } catch (err) {
    console.error("Deployment failed:", err);
    process.exit(1);
  }
}
deploy();
