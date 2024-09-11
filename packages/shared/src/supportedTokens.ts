import supportedChains from './supportedChains';
import { SupportedToken } from './types';
import * as chains from 'viem/chains';
import { NATIVE_TOKEN_ADDRESS } from './utils';

const supportedTokens: SupportedToken[] = [
  {
    tokenId: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://static.alchemyapi.io/images/assets/3408.png',
    addresses: [
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        chain: chains.mainnet,
      },
      {
        address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        chain: chains.optimism,
      },
      {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        chain: chains.base,
      },
      {
        address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
        chain: chains.baseSepolia,
      },
    ],
  },
  {
    tokenId: 'wbtc',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 6,
    logoURI: 'https://static.alchemyapi.io/images/assets/3717.png',
    addresses: [
      {
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        chain: chains.mainnet,
      },
    ],
  },
  {
    tokenId: 'eth',
    symbol: 'ETH',
    name: 'ETH',
    decimals: 18,
    logoURI:
      'https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628',
    addresses: supportedChains.map(chain => ({
      address: NATIVE_TOKEN_ADDRESS,
      chain,
    })),
  },
];

export default supportedTokens;
