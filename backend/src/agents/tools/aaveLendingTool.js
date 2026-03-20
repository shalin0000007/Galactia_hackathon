const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const aaveService = require("../../services/aaveService");

const aaveLendingTool = new DynamicStructuredTool({
  name: "get_aave_lending_rates",
  description: "Fetches live Aave V3 USDT lending rates (supply APY, borrow APY, total supplied, total borrowed) from a specific blockchain. Supported chains: ethereum, arbitrum, base.",
  schema: z.object({
    chain: z.string().optional().describe("Chain to query: 'ethereum', 'arbitrum', or 'base'. Defaults to 'ethereum'."),
  }),
  func: async ({ chain }) => {
    try {
      const data = await aaveService.getReserveData(chain || 'ethereum');
      console.log(`[aaveLendingTool] Fetched Aave V3 data on ${chain || 'ethereum'}`);
      return JSON.stringify(data);
    } catch (err) {
      console.error(`[aaveLendingTool] Error: ${err.message}`);
      return `Error fetching Aave data: ${err.message}`;
    }
  }
});

module.exports = { aaveLendingTool };
