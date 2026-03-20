const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const { ethers } = require("ethers");
const config = require("../../config");

const sonicGasTool = new DynamicStructuredTool({
  name: "get_sonic_network_status",
  description: "Fetches live gas prices, current block number, and network conditions from the Sonic blockchain Explorer RPC. Use this to estimate execution costs before planning or 'executing' trades.",
  schema: z.object({}), // No input required
  func: async () => {
    try {
      console.log(`[sonicGasTool] Fetching live network status from Sonic RPC (${config.sonic.rpcUrl})...`);
      const provider = new ethers.JsonRpcProvider(config.sonic.rpcUrl);
      
      const [feeData, blockNumber] = await Promise.all([
        provider.getFeeData(),
        provider.getBlockNumber()
      ]);
      
      return JSON.stringify({
        network: "Sonic Mainnet",
        chainId: 146,
        current_block: blockNumber,
        gas_price_gwei: ethers.formatUnits(feeData.gasPrice || 0n, "gwei"),
        status: "operational"
      });
    } catch (err) {
      console.error(`[sonicGasTool] Error: ${err.message}`);
      return `Error fetching Sonic network status: ${err.message}`;
    }
  }
});

module.exports = { sonicGasTool };
