import { trpc } from '@/lib/trpc';
import useIsSignedIn from './useIsSignedIn';
import { useCallback } from 'react';
import { formatAmount, toCoingeckoTokenId } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';
import supportedTokens from '@raylac/shared/out/supportedTokens';
import { formatUnits } from 'viem';

const useTokenBalances = () => {
  const { data: isSignedIn } = useIsSignedIn();
  const { data: tokenPrices } = trpc.getTokenPrices.useQuery();

  const { data: tokenBalances } = trpc.getTokenBalances.useQuery(null, {
    enabled: isSignedIn,
    throwOnError: false, // Don't throw on error for this particular query in all environments
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const getTokenPrice = useCallback(
    (tokenId: string): number | null => {
      if (!tokenPrices) {
        throw new Error('Token prices not fetched yet');
      }

      const tokenPrice = tokenPrices[toCoingeckoTokenId(tokenId)];

      if (!tokenPrice) {
        throw new Error(`Token price not found for token ID ${tokenId}`);
      }

      return tokenPrice.usd!;
    },
    [tokenPrices]
  );

  return useQuery({
    queryKey: ['tokenBalances'],
    queryFn: () => {
      return tokenBalances?.map(tokenBalance => {
        const balance = BigInt(tokenBalance.balance);
        const tokenPrice = getTokenPrice(tokenBalance.tokenId);

        const tokenMetadata = supportedTokens.find(
          token => token.tokenId === tokenBalance.tokenId
        );

        const usdBalance = tokenPrice
          ? tokenPrice *
            parseFloat(formatUnits(balance, tokenMetadata.decimals))
          : null;

        const formattedBalance = formatAmount(
          balance.toString(),
          tokenMetadata.decimals
        );

        const formattedUsdBalance = usdBalance ? usdBalance.toFixed(2) : '';

        return {
          ...tokenBalance,
          formattedBalance,
          formattedUsdBalance,
        };
      });
    },
    enabled: !!(tokenBalances && tokenPrices),
  });
};

export default useTokenBalances;
