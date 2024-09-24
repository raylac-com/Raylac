import supportedChains from './supportedChains';
import { SupportedToken } from './types';
// import * as chains from 'viem/chains';
import { zeroAddress } from 'viem';

export const NATIVE_TOKEN_ADDRESS = zeroAddress;

const supportedTokens: SupportedToken[] = [
  /*
  {
    tokenId: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://static.alchemyapi.io/images/assets/3408.png',
    addresses: [
      // https://developers.circle.com/stablecoins/docs/usdc-on-test-networks
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
      {
        address: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
        chain: chains.optimismSepolia,
      },
      {
        address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        chain: chains.arbitrumSepolia,
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
    tokenId: 'weth',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoURI: 'https://static.alchemyapi.io/images/assets/ETH.png',
    addresses: [
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        chain: chains.mainnet,
      },
      {
        address: '0x4200000000000000000000000000000000000006',
        chain: chains.baseSepolia,
      },
    ],
  },
  */
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
