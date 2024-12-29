import { trpc } from '@/lib/trpc';
import { Token } from '@raylac/shared';
import useUserAccount from './useUserAccount';
import { useQuery } from '@tanstack/react-query';
import { getAddress, hexToBigInt, zeroAddress } from 'viem';

const useChainTokenBalance = ({
  chainId,
  token,
}: {
  chainId: number | null;
  token: Token | null;
}) => {
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
    queryKey: [
      'user-token-balance',
      token,
      userAccount,
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
        return balance.breakdown.some(breakdown => {
          return (
            getAddress(breakdown.tokenAddress) ===
            getAddress(tokenAddressOnChain.address)
          );
        });
      });

      const tokenBalanceOnChain = totalTokenBalance?.breakdown.find(
        breakdown => {
          return breakdown.chainId === chainId;
        }
      );

      if (tokenBalanceOnChain === undefined) {
        return BigInt(0);
      }

      return hexToBigInt(tokenBalanceOnChain.balance);
    },
    enabled: !!token && !!tokenBalances && !!userAccount && !!chainId,
  });

  return {
    ...query,
    isLoading: isLoadingTokenBalance || query.isLoading,
  };
};

export default useChainTokenBalance;
