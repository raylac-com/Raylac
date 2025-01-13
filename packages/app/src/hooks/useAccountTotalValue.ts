import { useQuery } from '@tanstack/react-query';
import { getAccountTotalvalue } from '@raylac/shared';
import useTokenBalances from './useTokenBalances';
import { trpc } from '@/lib/trpc';

const useAccountTotalValue = () => {
  const { data: tokenBalances } = useTokenBalances();

  const { data: exchangeRate } = trpc.getExchangeRate.useQuery();

  const query = useQuery({
    queryKey: ['account-total-value', tokenBalances],
    queryFn: () => {
      if (tokenBalances === undefined || exchangeRate === undefined) {
        return null;
      }

      const accountTotalValue = getAccountTotalvalue({
        tokenBalances,
        exchangeRate,
      });

      return accountTotalValue;
    },
  });

  return {
    ...query,
    isLoading:
      tokenBalances === undefined ||
      exchangeRate === undefined ||
      query.isLoading,
  };
};

export default useAccountTotalValue;
