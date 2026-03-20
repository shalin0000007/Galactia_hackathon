const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const bridgeService = require("../../services/bridgeService");

const bridgeTool = new DynamicStructuredTool({
  name: "estimate_usdt0_bridge",
  description: "Estimates the fee and time for bridging USDT across chains using the USDT0 (LayerZero V2) protocol. Supports 15+ chains including Ethereum, Arbitrum, Base, Polygon, Sonic, Optimism, and more.",
  schema: z.object({
    fromChain: z.string().describe("Source chain name (e.g., 'Ethereum', 'Sonic', 'Arbitrum')"),
    toChain: z.string().describe("Destination chain name (e.g., 'Base', 'Polygon', 'Optimism')"),
    amount: z.number().describe("Amount of USDT to bridge"),
  }),
  func: async ({ fromChain, toChain, amount }) => {
    try {
      console.log(`[bridgeTool] Estimating bridge: ${amount} USDT from ${fromChain} → ${toChain}`);
      const estimate = await bridgeService.estimateBridgeFee(fromChain, toChain, amount);
      return JSON.stringify(estimate);
    } catch (err) {
      console.error(`[bridgeTool] Error: ${err.message}`);
      return `Error estimating bridge fee: ${err.message}`;
    }
  }
});

module.exports = { bridgeTool };
