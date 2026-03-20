const { ethers } = require('ethers');
require('dotenv').config();
const walletService = require('./src/services/walletService');

const rpcUrl = 'https://rpc.blaze.soniclabs.com';
const usdtAddress = '0x02EB358F508707FE091756135e5890207b01DC49';
const abi = ["function transfer(address to, uint256 value) public returns (bool)"];

async function main() {
  const account = await walletService.createWallet('Manager Agent', 0);
  const instance = walletService.getAccountInstance(account.address);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // WDK's internal Ethers wallet
  const signer = instance._account.connect(provider);
  console.log("Manager Address:", signer.address);

  const usdtContract = new ethers.Contract(usdtAddress, abi, signer);
  const amountToBurn = 99500n * 1000000n;
  const burnAddress = "0x000000000000000000000000000000000000dEaD";
  
  console.log("Burning 99,500 USDT...");
  try {
    const tx = await usdtContract.transfer(burnAddress, amountToBurn);
    console.log("Tx hash:", tx.hash);
    await tx.wait();
    console.log("Successfully burned excess tokens!");
  } catch (error) {
    console.error("Error burning tokens:", error);
  }
}
main();
