import { trpc } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { Hex, zeroAddress } from 'viem';

const useTokenMeta = (tokenAddress: Hex | null) => {
  const { data: token } = trpc.getToken.useQuery(
    {
      tokenAddress: tokenAddress ?? zeroAddress,
    },
    {
      enabled: !!tokenAddress,
    }
  );

  return useQuery({
    queryKey: ['tokenMeta', token, tokenAddress],
    queryFn: () => {
      return token;
    },
    enabled: !!token && !!tokenAddress,
  });
};

export default useTokenMeta;
