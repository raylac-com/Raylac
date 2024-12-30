import { trpc } from '@/lib/trpc';
import { Token } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';
import { getAddress, hexToBigInt } from 'viem';
import useUserAddresses from './useUserAddresses';

const useChainTokenBalance = ({
  chainId,
  token,
}: {
  chainId: number | null;
  token: Token | null;
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
    queryKey: [
      'user-token-balance',
      token,
      userAddresses,
      tokenBalances,
      chainId,
    ],
    queryFn: () => {
      if (tokenBalances === undefined) {
        throw new Error('Token balances not loaded');
      }

      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token === null) {
        throw new Error('Token not loaded');
      }

      const tokenAddressOnChain = token.addresses.find(
        address => address.chainId === chainId
      );

      if (tokenAddressOnChain === undefined) {
        throw new Error(
          `${token.symbol} address not found for chainId ${chainId}`
        );
      }

      const totalTokenBalance = tokenBalances.find(balance => {
        return balance.combinedBreakdown.some(breakdown => {
          return (
            getAddress(breakdown.tokenAddress) ===
            getAddress(tokenAddressOnChain.address)
          );
        });
      });

      const tokenBalanceOnChain = totalTokenBalance?.combinedBreakdown.find(
        breakdown => {
          return breakdown.chainId === chainId;
        }
      );

      if (tokenBalanceOnChain === undefined) {
        return BigInt(0);
      }

      return hexToBigInt(tokenBalanceOnChain.balance);
    },
    enabled: !!token && !!tokenBalances && !!userAddresses && !!chainId,
  });

  return {
    ...query,
    isLoading: isLoadingTokenBalance || query.isLoading,
  };
};

export default useChainTokenBalance;
