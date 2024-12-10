import { Hex, parseEther, toHex, zeroAddress } from 'viem';
import { TokenBalancesReturnType } from '@raylac/shared';
import { base, optimism } from 'viem/chains';

const getTokenBalances = async ({
  address: _address,
}: {
  address: Hex;
}): Promise<TokenBalancesReturnType> => {
  return [
    {
      token: {
        name: 'Ethereum',
        symbol: 'ETH',
        logoURI:
          'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
        decimals: 18,
        addresses: [
          {
            chainId: base.id,
            address: zeroAddress,
          },
        ],
      },
      balance: toHex(parseEther('0.4')),
      usdValue: 387.5,
      tokenPrice: 3000.24,
      breakdown: [
        {
          chainId: base.id,
          balance: toHex(parseEther('0.3')),
          tokenAddress: zeroAddress,
        },
        {
          chainId: optimism.id,
          balance: toHex(parseEther('0.1')),
          tokenAddress: zeroAddress,
        },
      ],
    },
  ];
};

export default getTokenBalances;
