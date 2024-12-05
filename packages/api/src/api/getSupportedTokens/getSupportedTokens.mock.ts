import { SupportedTokensReturnType } from '@raylac/shared';
import { zeroAddress } from 'viem';
import { base } from 'viem/chains';

const getSupportedTokens = (_chainIds: number[]): SupportedTokensReturnType => {
  return [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      addresses: [
        {
          chainId: base.id,
          address: zeroAddress,
        },
      ],
      decimals: 18,
      logoURI:
        'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1796508806',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      addresses: [
        {
          chainId: base.id,
          address: '0x833589fCD6eDb6E08B1Daf2d5Fb60F3f654AD9D9',
        },
      ],
      decimals: 6,
      logoURI:
        'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
    },
  ];
};

export default getSupportedTokens;
