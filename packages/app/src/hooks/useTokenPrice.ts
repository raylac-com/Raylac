import { trpc } from '@/lib/trpc';
import { toCoingeckoTokenId } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

const useTokenPrice = (tokenId: string) => {
  const { data: tokenPrices } = trpc.getTokenPrices.useQuery();

  const getTokenPrice = useCallback(
    (tokenId: string): number | null => {
      if (!tokenPrices) {
        return null;
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
    queryKey: ['tokenPrice', tokenId],
    queryFn: () => {
      return getTokenPrice(tokenId);
    },
  });
};

export default useTokenPrice;
