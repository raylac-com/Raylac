import { getCanonicalChain, getPublicClient } from '@raylac/shared';

const chain = getCanonicalChain();

export const publicClient = getPublicClient({
  chainId: chain.id,
});
