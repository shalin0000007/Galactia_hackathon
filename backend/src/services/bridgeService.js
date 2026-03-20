/**
 * USDT0 Cross-Chain Bridge Service
 * 
 * Provides bridge fee estimation and supported chain info for USDT0
 * cross-chain transfers via LayerZero V2.
 */

const { ethers } = require('ethers');

// USDT0 supported chains (LayerZero V2 endpoints)
const SUPPORTED_CHAINS = [
  { name: 'Ethereum', chainId: 1, lzEndpointId: 30101 },
  { name: 'Arbitrum', chainId: 42161, lzEndpointId: 30110 },
  { name: 'Base', chainId: 8453, lzEndpointId: 30184 },
  { name: 'Polygon', chainId: 137, lzEndpointId: 30109 },
  { name: 'Optimism', chainId: 10, lzEndpointId: 30111 },
  { name: 'Sonic', chainId: 146, lzEndpointId: 30332 },
  { name: 'Berachain', chainId: 80094, lzEndpointId: 30362 },
  { name: 'Ink', chainId: 57073, lzEndpointId: 30339 },
  { name: 'Unichain', chainId: 130, lzEndpointId: 30363 },
  { name: 'Scroll', chainId: 534352, lzEndpointId: 30214 },
  { name: 'zkSync Era', chainId: 324, lzEndpointId: 30165 },
  { name: 'Blast', chainId: 81457, lzEndpointId: 30243 },
  { name: 'Mantle', chainId: 5000, lzEndpointId: 30181 },
  { name: 'Linea', chainId: 59144, lzEndpointId: 30183 },
  { name: 'Mode', chainId: 34443, lzEndpointId: 30260 },
];

class BridgeService {
  /**
   * Get all supported USDT0 bridge destination chains
   * @returns {Object} List of chains with metadata
   */
  getSupportedChains() {
    return {
      protocol: 'USDT0 (LayerZero V2)',
      totalChains: SUPPORTED_CHAINS.length,
      chains: SUPPORTED_CHAINS,
    };
  }

  /**
   * Estimate bridge fee for a USDT0 transfer between chains
   * @param {string} fromChain - Source chain name
   * @param {string} toChain - Destination chain name
   * @param {number} amount - Amount of USDT to bridge
   * @returns {Object} Fee estimation
   */
  async estimateBridgeFee(fromChain, toChain, amount) {
    const from = SUPPORTED_CHAINS.find(c => c.name.toLowerCase() === fromChain.toLowerCase());
    const to = SUPPORTED_CHAINS.find(c => c.name.toLowerCase() === toChain.toLowerCase());

    if (!from) return { error: `Unsupported source chain: ${fromChain}` };
    if (!to) return { error: `Unsupported destination chain: ${toChain}` };
    if (from.name === to.name) return { error: 'Source and destination cannot be the same chain' };

    // Estimate based on LayerZero typical fees
    // Gas on source chain + LayerZero relay fee
    const baseFee = 0.001; // ~$0.001 base protocol fee
    const gasMultiplier = from.chainId === 1 ? 3.0 : 0.5; // Ethereum is more expensive
    const estimatedGas = baseFee * gasMultiplier;
    const totalFee = estimatedGas + 0.0005; // relay fee

    return {
      from: from.name,
      fromChainId: from.chainId,
      to: to.name,
      toChainId: to.chainId,
      amount: `${amount} USDT`,
      estimatedFee: `~$${totalFee.toFixed(4)}`,
      estimatedTime: '1-5 minutes',
      protocol: 'LayerZero V2 (USDT0)',
      note: 'Estimate based on typical LayerZero relay costs',
    };
  }

  /**
   * Get bridge status / availability
   */
  getBridgeStatus() {
    return {
      status: 'operational',
      protocol: 'USDT0 via LayerZero V2',
      supportedAssets: ['USDT'],
      totalChains: SUPPORTED_CHAINS.length,
      bridgeType: 'OFT (Omnichain Fungible Token)',
    };
  }
}

module.exports = new BridgeService();
