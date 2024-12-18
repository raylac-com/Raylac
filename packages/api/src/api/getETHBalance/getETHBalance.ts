import { getPublicClient, supportedChains } from '@raylac/shared';
import { Hex } from 'viem';

const getETHBalance = async ({ address }: { address: Hex }) => {
  const chainIds = supportedChains.map(chain => chain.id);

  const balances = await Promise.all(
    chainIds.map(async chainId => {
      const publicClient = getPublicClient({ chainId });

      const balance = await publicClient.getBalance({ address });

      return {
        balance: balance.toString(),
        chain: chainId,
      };
    })
  );

  return balances;
};

export default getETHBalance;
