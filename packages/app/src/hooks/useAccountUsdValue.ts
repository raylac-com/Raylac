import { trpc } from '@/lib/trpc';
import useUserAccount from './useUserAccount';
import { useQuery } from '@tanstack/react-query';
import { zeroAddress } from 'viem';
import BigNumber from 'bignumber.js';
import { formatUsdValue } from '@raylac/shared';

const useAccountUsdValue = () => {
  const { data: userAccount } = useUserAccount();

  const { data: tokenBalances } = trpc.getTokenBalances.useQuery(
    {
      address: userAccount?.address ?? zeroAddress,
    },
    {
      enabled: !!userAccount,
    }
  );

  const query = useQuery({
    queryKey: ['account-usd-value', userAccount, tokenBalances],
    queryFn: () => {
      const accountUsdValue = tokenBalances?.reduce((acc, tokenBalance) => {
        return acc.plus(new BigNumber(tokenBalance.usdValue));
      }, new BigNumber(0));

      return accountUsdValue === undefined
        ? null
        : formatUsdValue(accountUsdValue);
    },
  });

  return {
    ...query,
    isLoading: tokenBalances === undefined || query.isLoading,
  };
};

export default useAccountUsdValue;
