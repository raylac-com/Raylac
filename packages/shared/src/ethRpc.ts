import {
  HttpTransport,
  PublicClient,
  createPublicClient,
  createWalletClient,
  http,
} from 'viem';
import { Chain, base, baseSepolia } from 'viem/chains';

/**
 * Get the chain based on the environment
 */
export const getChain = (): Chain => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.CHAIN === 'sepolia' ||
    process.env.EXPO_PUBLIC_CHAIN === 'sepolia'
  ) {
    return baseSepolia;
  }

  return base;
};

export const getAlchemyRpcUrl = ({
  chain,
  apiKey,
}: {
  chain: Chain;
  apiKey: string;
}) => {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  if (chain === baseSepolia) {
    return `https://base-sepolia.g.alchemy.com/v2/${apiKey}`;
  } else if (chain === base) {
    return `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;
  } else {
    throw new Error(`Unknown chain: ${chain}`);
  }
};

/**
 * Get a `PublicClient` viem instance.
 * The chain is determined by the environment.
 */
export const getPublicClient = ({
  chain,
  rpcUrl,
}: {
  chain: Chain;
  rpcUrl: string;
}): PublicClient<HttpTransport, Chain> => {
  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  return client as PublicClient<HttpTransport, Chain>;
};

/**
 * Get a `WalletClient` viem instance.
 * The chain is determined by the environment.
 */
export const getWalletClient = ({
  chain,
  rpcUrl,
}: {
  chain: Chain;
  rpcUrl: string;
}) => {
  return createWalletClient({
    chain,
    transport: http(rpcUrl),
  });
};
