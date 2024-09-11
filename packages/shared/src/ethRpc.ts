import {
  HttpTransport,
  PublicClient,
  createPublicClient,
  createWalletClient,
  http,
} from 'viem';
import * as chains from 'viem/chains';
import { Chain, anvil, base, baseSepolia } from 'viem/chains';

const CHAIN = process.env.CHAIN || process.env.EXPO_PUBLIC_CHAIN;

if (CHAIN !== 'base-sepolia' && CHAIN !== 'base-mainnet' && CHAIN !== 'anvil') {
  throw new Error(`Unknown chain: ${CHAIN}`);
}

/**
 * Get the canonical chain based on the environment variable `CHAIN`.
 */
export const getCanonicalChain = (): Chain => {
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

export const getAlchemyRpcUrl = ({ chain }: { chain: Chain }) => {
  const apiKey =
    process.env.ALCHEMY_API_KEY || process.env.EXPO_PUBLIC_ALCHEMY_API_KEY;

  if (!apiKey) {
    throw new Error('ALCHEMY_API_KEY is not set');
  }

  let alchemySubdomain;

  switch (chain.id) {
    case chains.mainnet.id:
      alchemySubdomain = 'eth-mainnet';
      break;
    case chains.baseSepolia.id:
      alchemySubdomain = 'base-sepolia';
      break;
    case chains.base.id:
      alchemySubdomain = 'base-mainnet';
      break;
    case chains.optimism.id:
      alchemySubdomain = 'opt-mainnet';
      break;
    case chains.blast.id:
      alchemySubdomain = 'blast-mainnet';
      break;
    default:
      throw new Error(`Unknown chain id: ${chain.id}`);
  }

  return `https://${alchemySubdomain}.g.alchemy.com/v2/${apiKey}`;
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
