import {
  getCanonicalChain,
  getPublicClient,
  getWalletClient,
} from '@raylac/shared';

const chain = getCanonicalChain();

export const publicClient = getPublicClient({
  chainId: chain.id,
});

export const walletClient = getWalletClient({
  chainId: chain.id,
});
