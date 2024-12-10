import { SupportedTokensReturnType } from '@raylac/shared';
import { zeroAddress } from 'viem';
import { base } from 'viem/chains';

const getSupportedTokens = (_args: {
  chainIds: number[];
  searchTerm?: string;
}): SupportedTokensReturnType => {
  return [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      verified: true,
      addresses: [
        {
          chainId: base.id,
          address: zeroAddress,
        },
      ],
      decimals: 18,
      logoURI:
        'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      verified: true,
      addresses: [
        {
          chainId: base.id,
          address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        },
      ],
      decimals: 6,
      logoURI:
        'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
    },
  ];
};

export default getSupportedTokens;
