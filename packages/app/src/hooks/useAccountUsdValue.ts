import { trpc } from '@/lib/trpc';
import useUserAddress from './useUserAddress';
import { useQuery } from '@tanstack/react-query';

const useAccountUsdValue = () => {
  const { data: userAddress } = useUserAddress();

  const { data: tokenBalances } = trpc.getTokenBalances.useQuery(
    {
      address: userAddress!,
    },
    {
      enabled: !!userAddress,
    }
  );

  const query = useQuery({
    queryKey: ['account-usd-value', userAddress, tokenBalances],
    queryFn: () => {
      const accountUsdValue = tokenBalances?.reduce((acc, tokenBalance) => {
        return acc + (tokenBalance.usdValue ?? 0);
      }, 0);

      return accountUsdValue === undefined ? null : accountUsdValue;
    },
  });

  return {
    ...query,
    isLoading: tokenBalances === undefined || query.isLoading,
  };
};

export default useAccountUsdValue;
