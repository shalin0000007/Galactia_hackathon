const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const axios = require("axios");

const defiYieldTool = new DynamicStructuredTool({
  name: "get_defi_yields",
  description: "Fetches live DeFi yield pools from DefiLlama. You can optionally filter by chain (e.g., 'Ethereum', 'Sonic'). Returns the Top 5 pools by TVL.",
  schema: z.object({
    chain: z.string().optional().describe("Blockchain name to filter by (e.g., 'Ethereum', 'Sonic'). Leave empty for global top pools."),
  }),
  func: async ({ chain }) => {
    try {
      console.log(`[defiYieldTool] Fetching yields${chain ? ` for chain: ${chain}` : ' globally'}`);
      const response = await axios.get(`https://yields.llama.fi/pools`);
      let pools = response.data.data;
      
      if (chain) {
        pools = pools.filter(p => p.chain.toLowerCase() === chain.toLowerCase());
      }
      
      // Sort by TVL descending and take top 5
      const topPools = pools
        .sort((a, b) => b.tvlUsd - a.tvlUsd)
        .slice(0, 5)
        .map(p => ({
          project: p.project,
          symbol: p.symbol,
          chain: p.chain,
          apy: Number(p.apy).toFixed(2) + '%',
          tvlUsd: p.tvlUsd
        }));
        
      if (topPools.length === 0) return `No pools found for chain: ${chain}`;
      return JSON.stringify(topPools);
    } catch (err) {
      console.error(`[defiYieldTool] Error: ${err.message}`);
      return `Error fetching DeFi yields: ${err.message}`;
    }
  }
});

module.exports = { defiYieldTool };
