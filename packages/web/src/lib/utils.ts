import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { http } from 'viem';
import * as chains from 'viem/chains';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getAlchemySubdomain = (chainId: number) => {
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
    default:
      throw new Error(`Unknown chain id: ${chainId}`);
  }

  return alchemySubdomain;
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
