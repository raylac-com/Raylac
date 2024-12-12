import { getPublicClient } from '@raylac/shared/src/ethRpc';
import { useQuery } from '@tanstack/react-query';
import { mainnet } from 'viem/chains';

const useEnsAddress = (name: string) => {
  const getEnsAddress = async (name: string) => {
    if (!name.endsWith('.eth')) {
      return null;
    }

    const publicClient = getPublicClient({ chainId: mainnet.id });

    const ensAddress = await publicClient.getEnsAddress({
      name,
      universalResolverAddress: '0x74E20Bd2A1fE0cdbe45b9A1d89cb7e0a45b36376',
    });

    return ensAddress;
  };

  return useQuery({
    queryKey: ['ensAddress', name],
    queryFn: () => getEnsAddress(name),
  });
};

export default useEnsAddress;
