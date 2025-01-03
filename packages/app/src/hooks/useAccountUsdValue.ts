import { trpc } from '@/lib/trpc';
import useUserAddresses from './useUserAddresses';
import { useQuery } from '@tanstack/react-query';
import { getTotalUsdValue } from '@raylac/shared';

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
      if (tokenBalances === undefined) {
        return null;
      }

      const accountUsdValue = getTotalUsdValue(tokenBalances);

      return accountUsdValue;
    },
  });

  return {
    ...query,
    isLoading: tokenBalances === undefined || query.isLoading,
  };
};

export default useAccountUsdValue;
