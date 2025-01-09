import { supportedChains, Token } from '.';
import { getAddress, zeroAddress } from 'viem';
import { arbitrum, base, mainnet, optimism, polygon } from 'viem/chains';

export const ETH: Token = {
  id: zeroAddress,
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
};

export const USDC: Token = {
  id: getAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  verified: true,
  logoURI:
    'https://coin-images.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
  addresses: [
    {
      chainId: mainnet.id,
      address: getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
    },
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
  ],
};

export const WST_ETH: Token = {
  id: getAddress('0x5979D7b546E38E414F7E9822514be443A4800529'),
  symbol: 'wstETH',
  name: 'Wrapped staked ETH',
  decimals: 18,
  verified: true,
  logoURI:
    'https://firebasestorage.googleapis.com/v0/b/raylac-72351.appspot.com/o/wsteth.png?alt=media&token=c80c5f5e-6ada-47cf-8a30-87fd6f374bad',
  addresses: [
    {
      chainId: mainnet.id,
      address: getAddress('0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0'),
    },
    {
      chainId: arbitrum.id,
      address: getAddress('0x5979D7b546E38E414F7E9822514be443A4800529'),
    },
    {
      chainId: optimism.id,
      address: getAddress('0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb'),
    },
    {
      chainId: base.id,
      address: getAddress('0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452'),
    },
    /*
    {
      chainId: scroll.id,
      address: getAddress('0xf610A9dfB7C89644979b4A0f27063E9e7d7Cda32'),
    },
    */
  ],
};

export const ST_ETH: Token = {
  id: getAddress('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'),
  symbol: 'stETH',
  name: 'Staked ETH',
  decimals: 18,
  verified: true,
  logoURI: 'https://arbiscan.io/token/images/lido_32.png',
  addresses: [
    {
      chainId: mainnet.id,
      address: getAddress('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'),
    },
  ],
};

export const USDT: Token = {
  id: getAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7'), // Mainnet address
  symbol: 'USDT',
  name: 'Tether USD',
  decimals: 6,
  verified: true,
  logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png', // example logo
  addresses: [
    {
      chainId: mainnet.id,
      address: getAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7'),
    },
  ],
};

export const DEGEN: Token = {
  id: getAddress('0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed'),
  symbol: 'DEGEN',
  name: 'Degen Token',
  decimals: 18,
  verified: false, // set to true if you verify the token
  logoURI:
    'https://coin-images.coingecko.com/coins/images/34515/large/android-chrome-512x512.png?1706198225',
  addresses: [
    {
      chainId: base.id,
      address: getAddress('0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed'),
    },
    // Add more chains/addresses if available
  ],
};

export const USDe: Token = {
  id: getAddress('0x4c9EDD5852cd905f086C759E8383e09bff1E68B3'),
  symbol: 'USDe',
  name: 'USD eToken',
  decimals: 6,
  verified: false,
  logoURI: 'https://www.cryptologos.cc/logos/ethena-usde-usde-logo.png?v=040',
  addresses: [
    {
      chainId: mainnet.id,
      address: getAddress('0x4c9EDD5852cd905f086C759E8383e09bff1E68B3'),
    },
  ],
};

export const DAI: Token = {
  id: getAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
  symbol: 'DAI',
  name: 'Dai Stablecoin',
  decimals: 18,
  verified: true,
  logoURI: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
  addresses: [
    {
      chainId: mainnet.id,
      address: getAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
    },
  ],
};

export const KNOWN_TOKENS: Token[] = [
  ETH,
  USDC,
  WST_ETH,
  ST_ETH,
  USDT,
  DEGEN,
  USDe,
  DAI,
].map(token => ({
  ...token,
  isKnownToken: true,
}));
