import { getPublicClient } from '@raylac/shared';
import { useQuery } from '@tanstack/react-query';
import { Hex } from 'viem';
import { mainnet } from 'viem/chains';

const client = getPublicClient({
  chainId: mainnet.id,
});

const useEnsName = (address: Hex) => {
  return useQuery({
    queryKey: ['ensName', address],
    queryFn: async () => {
      const name = await client.getEnsName({ address });
      // Fetch the ENS name for the given address
      // For now, we'll just return the address itself
      return name;
    },
  });
};

export default useEnsName;
