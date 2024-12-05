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
      name: 'Ethereum',
      symbol: 'ETH',
      logoUrl:
        'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1698802923',
      decimals: 18,
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
