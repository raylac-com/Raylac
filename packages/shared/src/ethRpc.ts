import {
  HttpTransport,
  PublicClient,
  WebSocketTransport,
  createPublicClient,
  createWalletClient,
  http,
  webSocket,
} from 'viem';
import * as chains from 'viem/chains';
import { Chain } from 'viem/chains';
import { getChainFromId } from './utils';

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
    case chains.sepolia.id:
      alchemySubdomain = 'eth-sepolia';
      break;
    case chains.base.id:
      alchemySubdomain = 'base-mainnet';
      break;
    case chains.baseSepolia.id:
      alchemySubdomain = 'base-sepolia';
      break;
    case chains.optimism.id:
      alchemySubdomain = 'opt-mainnet';
      break;
    case chains.optimismSepolia.id:
      alchemySubdomain = 'opt-sepolia';
      break;
    case chains.blast.id:
      alchemySubdomain = 'blast-mainnet';
      break;
    case chains.blastSepolia.id:
      alchemySubdomain = 'blast-sepolia';
      break;
    case chains.arbitrum.id:
      alchemySubdomain = 'arb-mainnet';
      break;
    case chains.arbitrumSepolia.id:
      alchemySubdomain = 'arb-sepolia';
      break;
    case chains.polygon.id:
      alchemySubdomain = 'polygon-mainnet';
      break;
    case chains.polygonAmoy.id:
      alchemySubdomain = 'polygon-amoy';
      break;
    case chains.scroll.id:
      alchemySubdomain = 'scroll-mainnet';
      break;
    case chains.zksync.id:
      alchemySubdomain = 'zksync-mainnet';
      break;
    default:
      throw new Error(`getAlchemyRpcUrl: Unknown chain id: ${chain.id}`);
  }

  return `https://${alchemySubdomain}.g.alchemy.com/v2/${apiKey}`;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getDevChainRpcUrl = ({ chainId }: { chainId: number }): string => {
  /*
  const ANVIL_1_RPC_URL = process.env.ANVIL_1_RPC_URL;
  const ANVIL_2_RPC_URL = process.env.ANVIL_2_RPC_URL;

  switch (chainId) {
    case anvil1.id:
      if (!ANVIL_1_RPC_URL) {
        throw new Error('ANVIL_1_RPC_URL is not set');
      }
      return ANVIL_1_RPC_URL;
    case anvil2.id:
      if (!ANVIL_2_RPC_URL) {
        throw new Error('ANVIL_2_RPC_URL is not set');
      }
      return ANVIL_2_RPC_URL;
    default:
      throw new Error(`getDevChainRpcUrl: Unknown chain id: ${chainId}`);
  }
  */
  const ANVIL_RPC_URL = process.env.ANVIL_RPC_URL;

  if (!ANVIL_RPC_URL) {
    throw new Error('ANVIL_RPC_URL is not set');
  }

  return ANVIL_RPC_URL;
};

export const getQuickNodeRpcUrl = ({ chain }: { chain: Chain }): string => {
  const apiKey = process.env.QUICKNODE_API_KEY;

  if (!apiKey) {
    throw new Error('QUICKNODE_API_KEY is not set');
  }

  let quickNodeSubdomain;

  switch (chain.id) {
    case chains.mainnet.id:
      quickNodeSubdomain = 'eth-mainnet';
      break;
    case chains.sepolia.id:
      quickNodeSubdomain = 'eth-sepolia';
      break;
    case chains.base.id:
      quickNodeSubdomain = 'base-mainnet';
      break;
    case chains.baseSepolia.id:
      quickNodeSubdomain = 'base-sepolia';
      break;
    case chains.optimism.id:
      quickNodeSubdomain = 'optimism';
      break;
    case chains.optimismSepolia.id:
      quickNodeSubdomain = 'optimism-sepolia';
      break;
    case chains.blast.id:
      quickNodeSubdomain = 'blast-mainnet';
      break;
    case chains.blastSepolia.id:
      quickNodeSubdomain = 'blast-sepolia';
      break;
    case chains.arbitrum.id:
      quickNodeSubdomain = 'arbitrum-mainnet';
      break;
    case chains.arbitrumSepolia.id:
      quickNodeSubdomain = 'arb-sepolia';
      break;
    case chains.polygon.id:
      quickNodeSubdomain = 'matic';
      break;
    case chains.polygonAmoy.id:
      quickNodeSubdomain = 'polygon-amoy';
      break;
    case chains.scroll.id:
      quickNodeSubdomain = 'scroll-mainnet';
      break;
    case chains.zksync.id:
      quickNodeSubdomain = 'zksync-mainnet';
      break;
    default:
      throw new Error(`getQuickNodeRpcUrl: Unknown chain id: ${chain.id}`);
  }

  return `https://shy-wild-shard.${quickNodeSubdomain}.quiknode.pro/${apiKey}`;
};

/**
 * Get a `PublicClient` viem instance.
 * The chain is determined by the environment.
 */
export const getPublicClient = ({
  chainId,
}: {
  chainId: number;
}): PublicClient<HttpTransport, Chain> => {
  const chain = getChainFromId(chainId);

  const rpcUrl = getAlchemyRpcUrl({ chain });

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
export const getWalletClient = ({ chainId }: { chainId: number }) => {
  const chain = getChainFromId(chainId);

  const rpcUrl = getQuickNodeRpcUrl({ chain });

  return createWalletClient({
    chain,
    transport: http(rpcUrl),
  });
};

export const getWebsocketClient = ({ chainId }: { chainId: number }) => {
  const chain = getChainFromId(chainId);

  const rpcUrl = getQuickNodeRpcUrl({ chain }).replace('http', 'ws');

  const client = createPublicClient({
    chain,
    transport: webSocket(rpcUrl, {
      reconnect: {
        attempts: 30,
      },
    }),
  });

  return client as PublicClient<WebSocketTransport, Chain>;
};
