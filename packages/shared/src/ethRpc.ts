import {
  HttpTransport,
  PublicClient,
  createPublicClient,
  createWalletClient,
  http,
} from 'viem';
import { Chain, anvil, base, baseSepolia } from 'viem/chains';

const CHAIN = process.env.CHAIN || process.env.EXPO_PUBLIC_CHAIN;

if (CHAIN !== 'base-sepolia' && CHAIN !== 'base-mainnet' && CHAIN !== 'anvil') {
  throw new Error(`Unknown chain: ${CHAIN}`);
}

/**
 * Get the chain based on the environment
 */
export const getChain = (): Chain => {
  if (CHAIN === 'base-sepolia') {
    return baseSepolia;
  } else if (CHAIN === 'base-mainnet') {
    return base;
  } else if (CHAIN === 'anvil') {
    return anvil;
  } else {
    throw new Error(`Unknown chain: ${CHAIN}`);
  }
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
  } else  if (chain === anvil) {
    return `http://127.0.0.01:8545`;
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
