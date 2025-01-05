import { Token } from '@raylac/shared';

import { TokenAmount } from '@raylac/shared';

import { Hex } from 'viem';
import useTokenBalances from './useTokenBalances';
import { formatTokenAmount } from '@raylac/shared';
import BigNumber from 'bignumber.js';

type AddressTokenBalances = {
  address: Hex;
  tokenBalances: {
    token: Token;
    totalBalance: TokenAmount;
    chainBalances: {
      chainId: number;
      balance: TokenAmount;
    }[];
  }[];
};

const useTokenBalancePerAddress = ({
  addresses,
}: {
  addresses: Hex[];
}): AddressTokenBalances[] | undefined => {
  const { data: tokenBalances } = useTokenBalances();

  const tokenBalancesPerAddress: AddressTokenBalances[] = [];

  if (tokenBalances && addresses) {
    for (const address of addresses) {
      const addressTokenBalances = tokenBalances.filter(
        balance => balance.address === address
      );

      // Group by token
      const addressTokenIds = [
        ...new Set(addressTokenBalances.map(balance => balance.token.id)),
      ];

      const groupByTokens = [];

      for (const tokenId of addressTokenIds) {
        const tokenBalances = addressTokenBalances.filter(
          balance => balance.token.id === tokenId
        );

        const totalBalance = tokenBalances.reduce(
          (acc, balance) => acc + BigInt(balance.balance.amount),
          BigInt(0)
        );

        const formattedTotalBalance = formatTokenAmount({
          amount: totalBalance,
          token: tokenBalances[0].token,
          tokenPriceUsd: tokenBalances[0].balance.tokenPriceUsd,
        });

        groupByTokens.push({
          token: tokenBalances[0].token,
          totalBalance: formattedTotalBalance,
          chainBalances: tokenBalances.map(balance => ({
            chainId: balance.chainId,
            balance: balance.balance,
          })),
        });
      }

      const sortedGroupByTokens = groupByTokens.sort((a, b) => {
        if (a.token.addresses.length > b.token.addresses.length) {
          return -1;
        }

        if (a.token.addresses.length < b.token.addresses.length) {
          return 1;
        }

        if (
          new BigNumber(a.totalBalance.usdValue).gt(b.totalBalance.usdValue)
        ) {
          return -1;
        } else {
          return 1;
        }
      });

      tokenBalancesPerAddress.push({
        address,
        tokenBalances: sortedGroupByTokens,
      });
    }
  }

  const sortedTokenBalancesPerAddress = tokenBalancesPerAddress.sort((a, b) => {
    return b.tokenBalances.length - a.tokenBalances.length;
  });

  return sortedTokenBalancesPerAddress;
};

export default useTokenBalancePerAddress;
