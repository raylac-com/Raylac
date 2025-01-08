import { getPublicClient } from '@raylac/shared/src/ethRpc';
import { useQuery } from '@tanstack/react-query';
import { Hex } from 'viem';
import { mainnet } from 'viem/chains';

const useEnsName = (address: Hex) => {
  const getEnsName = async (address: Hex) => {
    const publicClient = getPublicClient({ chainId: mainnet.id });

    const ensName = await publicClient.getEnsName({
      address,
    });

    return ensName;
  };

  return useQuery({
    queryKey: ['ensName', address],
    queryFn: () => getEnsName(address),
  });
};

export default useEnsName;
