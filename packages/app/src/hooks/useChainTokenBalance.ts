import { trpc } from '@/lib/trpc';
import { getAddressChainTokenBalance, Token } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';
import { Hex } from 'viem';
import useUserAddresses from './useWriterAddresses';

/**
 * Returns the total token balance for a given chain and token for a list of addresses
 */
const useChainTokenBalance = ({
  chainId,
  token,
  address,
}: {
  chainId: number | null;
  token: Token | null;
  address: Hex;
}) => {
  const { data: userAddresses } = useUserAddresses();

  const { data: tokenBalances, isLoading: isLoadingTokenBalance } =
    trpc.getTokenBalances.useQuery(
      {
        addresses: userAddresses?.map(address => address.address) ?? [],
      },
      {
        enabled: !!userAddresses,
      }
    );

  const query = useQuery({
    queryKey: ['user-token-balance', token, address, tokenBalances, chainId],
    queryFn: () => {
      if (token && tokenBalances && chainId) {
        const addressChainTokenBalance = getAddressChainTokenBalance({
          tokenBalances,
          address,
          chainId,
          token,
        });

        return addressChainTokenBalance;
      }

      return null;
    },
    enabled: !!token && !!tokenBalances && !!userAddresses && !!chainId,
  });

  return {
    ...query,
    isLoading: isLoadingTokenBalance || query.isLoading,
  };
};

export default useChainTokenBalance;
