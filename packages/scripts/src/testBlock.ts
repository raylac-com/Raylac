import 'dotenv/config';
import { getPublicClient } from '@raylac/shared';
import { base } from 'viem/chains';

const testBlock = async () => {
  const client = getPublicClient({ chainId: base.id });

  const block = await client.getBlock({
    blockTag: 'latest',
  });

  const safe = await client.getBlock({
    blockTag: 'safe',
  });

  const finalizedBlock = await client.getBlock({
    blockTag: 'finalized',
  });

  console.log(block.number - finalizedBlock.number);
  console.log(block.number - safe.number);
};

testBlock();
