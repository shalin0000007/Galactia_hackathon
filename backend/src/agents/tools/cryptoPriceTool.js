const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const axios = require("axios");

const cryptoPriceTool = new DynamicStructuredTool({
  name: "get_crypto_prices",
  description: "Fetches live cryptocurrency prices and 24h changes from CoinGecko. Input a comma-separated list of coin IDs (e.g., 'bitcoin,ethereum,sonic-token'). It will return the live prices in USD.",
  schema: z.object({
    coin_ids: z.string().describe("Comma-separated CoinGecko IDs (e.g., 'bitcoin,ethereum,sonic-token')"),
  }),
  func: async ({ coin_ids }) => {
    try {
      console.log(`[cryptoPriceTool] Fetching live prices for: ${coin_ids}`);
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: coin_ids,
          vs_currencies: 'usd',
          include_24hr_change: true
        }
      });
      return JSON.stringify(response.data);
    } catch (err) {
      console.error(`[cryptoPriceTool] Error: ${err.message}`);
      return `Error fetching prices: ${err.message}`;
    }
  }
});

module.exports = { cryptoPriceTool };
