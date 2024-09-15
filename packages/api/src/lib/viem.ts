import {
  getAlchemyRpcUrl,
  getCanonicalChain,
  getPublicClient,
  getWalletClient,
} from '@raylac/shared';

const chain = getCanonicalChain();

const rpcUrl = getAlchemyRpcUrl({
  chain,
});

export const publicClient = getPublicClient({
  chainId: chain.id,
});

export const walletClient = getWalletClient({
  chain,
  rpcUrl,
});
