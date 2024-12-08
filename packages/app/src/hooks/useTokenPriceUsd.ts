import { trpc } from '@/lib/trpc';
import { SupportedTokensReturnType } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

const useTokenPriceUsd = (token: SupportedTokensReturnType[number] | null) => {
  const { data: tokenPrice, mutate: getTokenPrice } =
    trpc.getTokenPrice.useMutation();

  useEffect(() => {
    if (token) {
      getTokenPrice({
        tokenAddress: token.addresses[0].address,
        chainId: token.addresses[0].chainId,
      });
    }
  }, [token]);

  return useQuery({
    queryKey: ['token-price', token],
    queryFn: () => {
      if (tokenPrice === undefined) {
        return null;
      }

      const tokenPriceUSD = tokenPrice.prices.find(
        price => price.currency === 'usd'
      );

      if (tokenPriceUSD === undefined) {
        throw new Error('Token price not found');
      }

      return tokenPriceUSD.value;
    },
    enabled: !!token,
  });
};

export default useTokenPriceUsd;
