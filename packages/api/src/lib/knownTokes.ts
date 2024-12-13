import { supportedChains, SupportedTokensReturnType } from '@raylac/shared';
import { getAddress, zeroAddress } from 'viem';
import { arbitrum, base, optimism, polygon, zksync } from 'viem/chains';

export const KNOWN_TOKENS: SupportedTokensReturnType = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    verified: true,
    logoURI:
      'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
    addresses: supportedChains
      .filter(chain => chain.id !== polygon.id)
      .map(chain => ({
        chainId: chain.id,
        address: zeroAddress,
      })),
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    verified: true,
    logoURI:
      'https://coin-images.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
    addresses: [
      {
        chainId: base.id,
        address: getAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
      },
      {
        chainId: optimism.id,
        address: getAddress('0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'),
      },
      {
        chainId: arbitrum.id,
        address: getAddress('0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
      },
      {
        chainId: polygon.id,
        address: getAddress('0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'),
      },
      {
        chainId: zksync.id,
        address: getAddress('0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4'),
      },
    ],
  },
];
