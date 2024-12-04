import { SupportedTokensReturnType } from '@raylac/shared';

const getSupportedTokens = (_chainIds: number[]): SupportedTokensReturnType => {
  return [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      tokenAddress: '0x833589fCD6eDb6E08B1Daf2d5Fb60F3f654AD9D9',
      decimals: 6,
      logoURI:
        'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
    },
    {
      symbol: 'DEGEN',
      name: 'DEGEN',
      tokenAddress: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
      decimals: 18,
      logoURI:
        'https://www.cryptologos.cc/logos/degen-base-degen-logo.png?v=035',
    },
  ];
};

export default getSupportedTokens;
