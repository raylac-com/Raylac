import {
  getAlchemyRpcUrl,
  getChain,
  getPublicClient,
  getWalletClient,
} from '@sutori/shared';

const chain = getChain();

const rpcUrl = getAlchemyRpcUrl({
  chain,
  apiKey: process.env.ALCHEMY_API_KEY as string,
});

export const publicClient = getPublicClient({
  chain,
  rpcUrl,
});

export const walletClient = getWalletClient({
  chain,
  rpcUrl,
});
