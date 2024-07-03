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
export const getChain = () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.CHAIN === 'sepolia' ||
    process.env.EXPO_PUBLIC_CHAIN === 'sepolia'
  ) {
    return baseSepolia;
  }

  return base;
};

const ALCHEMY_BASE_SEPOLIA_API_KEY = process.env.ALCHEMY_BASE_SEPOLIA_API_KEY;
const ALCHEMY_BASE_API_KEY = process.env.ALCHEMY_BASE_API_KEY;

export const getEthRpcUrl = (chain: Chain) => {
  if (chain === baseSepolia) {
    if (!ALCHEMY_BASE_SEPOLIA_API_KEY) {
      throw new Error(
        'ALCHEMY_BASE_SEPOLIA_API_KEY is required in development'
      );
    }

    return `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_BASE_SEPOLIA_API_KEY}`;
  } else if (chain === base) {
    if (!ALCHEMY_BASE_API_KEY) {
      throw new Error('ALCHEMY_BASE_API_KEY is required in production');
    }

    return `https://base.g.alchemy.com/v2/${ALCHEMY_BASE_API_KEY}`;
  } else {
    throw new Error(`Unknown chain: ${chain}`);
  }
};

/**
 * Get a `PublicClient` viem instance.
 * The chain is determined by the environment.
 */
export const getPublicClient = (): PublicClient<HttpTransport, Chain> => {
  const chain = getChain();
  const transport = getEthRpcUrl(chain);

  const client = createPublicClient({
    chain,
    transport: http(transport),
  });

  return client as PublicClient<HttpTransport, Chain>;
};

/**
 * Get a `WalletClient` viem instance.
 * The chain is determined by the environment.
 */
export const getWalletClient = () => {
  const chain = getChain();
  const transport = getEthRpcUrl(chain);

  return createWalletClient({
    chain,
    transport: http(transport),
  });
};
