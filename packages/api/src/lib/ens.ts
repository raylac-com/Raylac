import { getPublicClient } from '@raylac/shared';
import { Hex } from 'viem';
import { mainnet } from 'viem/chains';
import NodeCache from 'node-cache';

const cache: NodeCache = new NodeCache({
  stdTTL: 60 * 60 * 24, // 24 hours
});

export const getEnsName = async (address: Hex) => {
  const cachedEnsName = cache.get(address);

  if (cachedEnsName) {
    return cachedEnsName as string;
  }

  const publicClient = await getPublicClient({
    chainId: mainnet.id,
  });

  const ensName = await publicClient.getEnsName({
    address,
  });

  //  cache.set(address, ensName);

  return ensName;
};
