import { getPublicClient } from '@raylac/shared';
import { supportedChains } from '@raylac/shared';
import { anvil, base } from 'viem/chains';

const getBlockTime = async () => {
  const client = getPublicClient({ chainId: base.id });

  for (const chain of supportedChains) {
    const client = getPublicClient({ chainId: chain.id });
    const latestBlock = await client.getBlock({ blockTag: 'latest' });

    const n = 20;
    const block = await client.getBlock({
      blockNumber: latestBlock.number - BigInt(n),
    });

    const blockTime = Number(latestBlock.timestamp - block.timestamp) / n;
    console.log(chain.name, block.number, blockTime);
  }
};

getBlockTime();
