import { createPublicClient, createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const chain = baseSepolia;

const transport =
  // http();
  http(
    `https://base-sepolia.g.alchemy.com/v2/BjrzZCLjdOu3etOMvJrm6HV63zBtxIjA`
  );

export const walletClient = createWalletClient({
  chain,
  transport,
});

const client = createPublicClient({
  chain,
  transport,
});

export default client;
