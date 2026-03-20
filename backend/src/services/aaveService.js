/**
 * Aave V3 Lending Service
 * 
 * Queries live Aave V3 pool data (APYs, TVL, user positions) using ethers.js.
 * Demonstrates DeFi protocol integration for the hackathon.
 */

const { ethers } = require('ethers');
const config = require('../config');

// Aave V3 Pool Data Provider ABI (read-only subset)
const POOL_DATA_PROVIDER_ABI = [
  'function getAllReservesTokens() view returns (tuple(string symbol, address tokenAddress)[])',
  'function getReserveData(address asset) view returns (uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)',
  'function getReserveConfigurationData(address asset) view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)',
];

// Known Aave V3 deployments  
const AAVE_DEPLOYMENTS = {
  ethereum: {
    rpc: 'https://eth.llamarpc.com',
    poolDataProvider: '0x7B4EB56E7CD4b454BA8ff71E4518426c84ecf98e',
    chainName: 'Ethereum Mainnet',
  },
  arbitrum: {
    rpc: 'https://arb1.arbitrum.io/rpc',
    poolDataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
    chainName: 'Arbitrum One',
  },
  base: {
    rpc: 'https://mainnet.base.org',
    poolDataProvider: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac',
    chainName: 'Base',
  },
};

// Well-known stablecoin addresses per chain
const USDT_ADDRESSES = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  base: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
};

class AaveService {
  /**
   * Get Aave V3 reserve data for USDT on a given chain
   * @param {string} chain - 'ethereum' | 'arbitrum' | 'base'
   * @returns {Object} Reserve data including APY
   */
  async getReserveData(chain = 'ethereum') {
    const deployment = AAVE_DEPLOYMENTS[chain];
    if (!deployment) {
      return { error: `Unsupported chain: ${chain}. Supported: ${Object.keys(AAVE_DEPLOYMENTS).join(', ')}` };
    }

    try {
      console.log(`[AaveService] Fetching USDT reserve data from Aave V3 on ${deployment.chainName}...`);
      const provider = new ethers.JsonRpcProvider(deployment.rpc);
      const checksummedProvider = ethers.getAddress(deployment.poolDataProvider);
      const poolDataProvider = new ethers.Contract(checksummedProvider, POOL_DATA_PROVIDER_ABI, provider);

      const usdtAddress = ethers.getAddress(USDT_ADDRESSES[chain]);
      const reserveData = await poolDataProvider.getReserveData(usdtAddress);
      const configData = await poolDataProvider.getReserveConfigurationData(usdtAddress);

      // Convert ray (1e27) to percentage APY
      const liquidityRateRay = reserveData.liquidityRate;
      const borrowRateRay = reserveData.variableBorrowRate;
      const supplyAPY = (Number(liquidityRateRay) / 1e27 * 100).toFixed(4);
      const borrowAPY = (Number(borrowRateRay) / 1e27 * 100).toFixed(4);

      return {
        chain: deployment.chainName,
        asset: 'USDT',
        supplyAPY: `${supplyAPY}%`,
        variableBorrowAPY: `${borrowAPY}%`,
        totalSupplied: ethers.formatUnits(reserveData.totalAToken, Number(configData.decimals)),
        totalBorrowed: ethers.formatUnits(reserveData.totalVariableDebt, Number(configData.decimals)),
        ltv: `${Number(configData.ltv) / 100}%`,
        liquidationThreshold: `${Number(configData.liquidationThreshold) / 100}%`,
        isActive: configData.isActive,
        borrowingEnabled: configData.borrowingEnabled,
        lastUpdated: new Date(Number(reserveData.lastUpdateTimestamp) * 1000).toISOString(),
      };
    } catch (err) {
      console.error(`[AaveService] Error fetching reserve data: ${err.message}`);
      return { error: err.message, chain: deployment.chainName };
    }
  }

  /**
   * Get Aave data across all supported chains at once
   * @returns {Array} Reserve data for each chain
   */
  async getMultiChainData() {
    const chains = Object.keys(AAVE_DEPLOYMENTS);
    const results = await Promise.allSettled(
      chains.map(chain => this.getReserveData(chain))
    );

    return chains.map((chain, i) => ({
      chain,
      ...(results[i].status === 'fulfilled' ? results[i].value : { error: results[i].reason?.message })
    }));
  }
}

module.exports = new AaveService();
