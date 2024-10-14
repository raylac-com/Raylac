import { getPublicClient } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';
import { mainnet } from 'viem/chains';

const client = getPublicClient({
  chainId: mainnet.id,
});

const useEnsAddress = (name: string) => {
  return useQuery({
    queryKey: ['ensAddress', name],
    queryFn: async () => {
      const address = await client.getEnsAddress({ name });
      return address;
    },
  });
};

export default useEnsAddress;
