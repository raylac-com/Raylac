import { TokenBalancesReturnType } from '@raylac/shared';
import { Hex } from 'viem';

const getTokenBalancesMock = async ({
  addresses: _addresses,
}: {
  addresses: Hex[];
}): Promise<TokenBalancesReturnType> => {
  /*
  return [
    {
      address: '0x0000000000000000000000000000000000000000',
      chainId: 1,
      token: ETH,
      balance: {
        amount: parseUnits('1', ETH.decimals).toString(),
        formatted: '1',
        usdValue: '1234.23',
        usdValueFormatted: '1234.23',
        tokenPriceUsd: 1234.23,
      },
    },
    {
      address: '0x0000000000000000000000000000000000000000',
      chainId: 1,
      token: USDC,
      balance: {
        amount: parseUnits('1234.23', USDC.decimals).toString(),
        formatted: '1234.23',
        usdValue: '1234.23',
        usdValueFormatted: '1234.23',
        tokenPriceUsd: 1,
      },
    },
  ];
  */
  return [];
};

export default getTokenBalancesMock;
