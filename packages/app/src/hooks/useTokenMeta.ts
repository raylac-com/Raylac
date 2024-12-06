import { trpc } from '@/lib/trpc';
import { supportedChains } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';
import { Hex } from 'viem';

const useTokenMeta = (tokenAddress: Hex | null) => {
  const { data: supportedTokens } = trpc.getSupportedTokens.useQuery({
    chainIds: supportedChains.map(chain => chain.id),
  });

  return useQuery({
    queryKey: ['tokenMeta', tokenAddress],
    queryFn: () => {
      if (!tokenAddress || !supportedTokens) return null;

      const tokenMeta = supportedTokens.find(token =>
        token.addresses.some(
          address =>
            address.address.toLowerCase() === tokenAddress.toLowerCase()
        )
      );

      return tokenMeta ?? null;
    },
    enabled: !!tokenAddress && !!supportedTokens,
  });
};

export default useTokenMeta;
