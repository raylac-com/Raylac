import {
  Chain,
  createPublicClient,
  http,
  webSocket,
  WebSocketTransport,
  PublicClient,
} from 'viem';
import * as chains from 'viem/chains';
import { ALCHEMY_API_KEY } from './lib/envVars';
import { Network } from 'alchemy-sdk';
import { getChainFromId } from '@raylac/shared';

export const getWebsocketClient = ({ chainId }: { chainId: number }) => {
  const chain = getChainFromId(chainId);

  const alchemySubdomain = getAlchemySubdomain(chainId);
  const webSocketUrl = `wss://${alchemySubdomain}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

  const client = createPublicClient({
    chain,
    transport: webSocket(webSocketUrl, {
      reconnect: {
        attempts: 30,
      },
    }),
  });

  return client as PublicClient<WebSocketTransport, Chain>;
};

export const getPublicClient = ({ chainId }: { chainId: number }) => {
  const chain = getChainFromId(chainId);

  return createPublicClient({
    chain,
    transport: getAlchemyHttpTransport({
      chainId: chain.id,
      apiKey: ALCHEMY_API_KEY,
    }),
  });
};

export const getAlchemySubdomain = (chainId: number) => {
  let alchemySubdomain;

  switch (chainId) {
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
    case chains.zora.id:
      alchemySubdomain = 'zora-mainnet';
      break;
    default:
      throw new Error(`getAlchemySubdomain: Unknown chain id: ${chainId}`);
  }

  return alchemySubdomain;
};

export const getQuickNodeSubDomain = (chainId: number) => {
  let quickNodeSubdomain;

  switch (chainId) {
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
    case chains.zora.id:
      quickNodeSubdomain = 'zora-mainnet';
      break;
    default:
      throw new Error(`getQuickNodeRpcUrl: Unknown chain id: ${chainId}`);
  }

  return quickNodeSubdomain;
};

export const getQuickNodeHttpTransport = ({
  chainId,
  apiKey,
}: {
  chainId: number;
  apiKey: string;
}) => {
  const subDomain = getQuickNodeSubDomain(chainId);

  return http(`https://shy-wild-shard.${subDomain}.quiknode.pro/${apiKey}`);
};

export const getAlchemyHttpTransport = ({
  chainId,
  apiKey,
}: {
  chainId: number;
  apiKey: string;
}) => {
  const alchemySubdomain = getAlchemySubdomain(chainId);

  return http(`https://${alchemySubdomain}.g.alchemy.com/v2/${apiKey}`);
};

export const getChainName = (chainId: number) => {
  const name = Object.values(chains).find(chain => chain.id === chainId)?.name;

  return `${name} (${chainId})`;
};

export const toAlchemyNetwork = (chainId: number): Network => {
  switch (chainId) {
    case chains.mainnet.id:
      return Network.ETH_MAINNET;
    case chains.base.id:
      return Network.BASE_MAINNET;
    case chains.arbitrum.id:
      return Network.ARB_MAINNET;
    case chains.optimism.id:
      return Network.OPT_MAINNET;
    default:
      throw new Error(`toAlchemyNetwork: Unknown chain id: ${chainId}`);
  }
};
