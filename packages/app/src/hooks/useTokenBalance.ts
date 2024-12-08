import { trpc } from '@/lib/trpc';
import { SupportedTokensReturnType } from '@raylac/shared';
import useUserAddress from './useUserAddress';
import { useQuery } from '@tanstack/react-query';
import { hexToBigInt } from 'viem';

const useTokenBalance = (token: SupportedTokensReturnType[number] | null) => {
  const { data: userAddress } = useUserAddress();

  const { data: tokenBalances, isLoading: isLoadingTokenBalance } =
    trpc.getTokenBalances.useQuery(
      {
        address: userAddress!,
      },
      {
        enabled: !!userAddress,
      }
    );

  const query = useQuery({
    queryKey: ['user-token-balance', token, userAddress, tokenBalances],
    queryFn: () => {
      if (tokenBalances === undefined) {
        throw new Error('Token balances not loaded');
      }

      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token === null) {
        throw new Error('Token not loaded');
      }

      const tokenBalance = tokenBalances.find(balance => {
        return balance.breakdown.find(breakdown => {
          return token.addresses.some(
            tokenAddress =>
              breakdown.tokenAddress === tokenAddress.address &&
              breakdown.chainId === tokenAddress.chainId
          );
        });
      });

      if (tokenBalance === undefined) {
        return BigInt(0);
      }

      return hexToBigInt(tokenBalance.balance);
    },
    enabled: !!token && !!tokenBalances && !!userAddress,
  });

  return {
    ...query,
    isLoading: isLoadingTokenBalance || query.isLoading,
  };
};

export default useTokenBalance;
