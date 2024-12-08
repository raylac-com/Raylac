import { trpc } from '@/lib/trpc';
import { SupportedTokensReturnType } from '@raylac/shared';
import useUserAccount from './useUserAccount';
import { useQuery } from '@tanstack/react-query';
import { getAddress, hexToBigInt, zeroAddress } from 'viem';

const useTokenBalance = (token: SupportedTokensReturnType[number] | null) => {
  const { data: userAccount } = useUserAccount();

  const { data: tokenBalances, isLoading: isLoadingTokenBalance } =
    trpc.getTokenBalances.useQuery(
      {
        address: userAccount?.address ?? zeroAddress,
      },
      {
        enabled: !!userAccount,
      }
    );

  const query = useQuery({
    queryKey: ['user-token-balance', token, userAccount, tokenBalances],
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
              getAddress(breakdown.tokenAddress) ===
                getAddress(tokenAddress.address) &&
              breakdown.chainId === tokenAddress.chainId
          );
        });
      });

      if (tokenBalance === undefined) {
        return BigInt(0);
      }

      return hexToBigInt(tokenBalance.balance);
    },
    enabled: !!token && !!tokenBalances && !!userAccount,
  });

  return {
    ...query,
    isLoading: isLoadingTokenBalance || query.isLoading,
  };
};

export default useTokenBalance;
