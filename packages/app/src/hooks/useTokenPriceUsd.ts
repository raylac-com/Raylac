import { trpc } from '@/lib/trpc';
import { Token } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

const useTokenPriceUsd = (token: Token | null) => {
  const { data: tokenPrice, mutate: getTokenPrice } =
    trpc.getTokenPrice.useMutation();

  useEffect(() => {
    if (token) {
      getTokenPrice({
        token,
      });
    }
  }, [token]);

  return useQuery({
    queryKey: ['token-price', token],
    queryFn: () => {
      if (tokenPrice === undefined) {
        throw new Error('tokenPrice is undefined');
      }

      return tokenPrice;
    },
    enabled: !!token && tokenPrice !== undefined,
  });
};

export default useTokenPriceUsd;
