import { trpc } from '@/lib/trpc';
import useUserAddresses from './useUserAddresses';
import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { formatUsdValue } from '@raylac/shared';

const useAccountUsdValue = () => {
  const { data: userAddresses } = useUserAddresses();

  const { data: tokenBalances } = trpc.getTokenBalances.useQuery(
    {
      addresses: userAddresses?.map(address => address.address) ?? [],
    },
    {
      enabled: !!userAddresses,
    }
  );

  const query = useQuery({
    queryKey: ['account-usd-value', userAddresses, tokenBalances],
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
