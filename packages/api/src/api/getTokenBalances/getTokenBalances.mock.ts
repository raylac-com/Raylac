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
        tokenPrice: {
          usd: '1234.23',
          jpy: '172792.20',
        },
        currencyValue: {
          raw: {
            usd: '1234.23',
            jpy: '172792.20',
          },
          formatted: {
            usd: '1,234.23',
            jpy: '172,792.20',
          },
        },
      },
    },
    {
      address: '0x0000000000000000000000000000000000000000',
      chainId: 1,
      token: USDC,
      balance: {
        amount: parseUnits('1234.23', USDC.decimals).toString(),
        formatted: '1234.23',
        tokenPrice: {
          usd: '1',
          jpy: '140',
        },
        currencyValue: {
          raw: {
            usd: '1234.23',
            jpy: '172792.20',
          },
          formatted: {
            usd: '1,234.23',
            jpy: '172,792.20',
          },
        },
      },
    },
  ];
  */
  return [];
};

export default getTokenBalancesMock;
