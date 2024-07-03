import { createPublicClient, createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { getChain } from './utils';

const chain = getChain();

const transport =
  chain.id === baseSepolia.id
    ? http(
        `https://base-sepolia.g.alchemy.com/v2/BjrzZCLjdOu3etOMvJrm6HV63zBtxIjA`
      )
    : http(
        'https://base-mainnet.g.alchemy.com/v2/kqG9cMzXHk97ry7Gcl53sWhbJ8iyEPcV'
      );

export const walletClient = createWalletClient({
  // @ts-ignore
  chain,
  transport,
});

const client = createPublicClient({
  // @ts-ignore
  chain,
  transport,
});

export default client;
