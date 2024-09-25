import { getPublicClient } from '@raylac/shared';
import NodeCache from 'node-cache';

export const JWT_PRIV_KEY = process.env.JWT_PRIV_KEY as string;

if (!JWT_PRIV_KEY) {
  throw new Error('JWT_PRIV_KEY is required');
}

const cache = new NodeCache();

const BLOCK_TIMESTAMP_CACHE_KEY = 'blockTimestamp';

const getBlockTimestampCacheKey = (blockNumber: number, chainId: number) =>
  `${BLOCK_TIMESTAMP_CACHE_KEY}-${blockNumber}-${chainId}`;

/**
 * Get the timestamp of a block.
 * This function caches the result in memory.
 */
export const getBlockTimestamp = async (
  blockNumber: number,
  chainId: number
): Promise<string> => {
  // Checking the cache
  const cachedBlockTimestamp = cache.get<string>(
    getBlockTimestampCacheKey(blockNumber, chainId)
  );

  // If the value is in the cache, return it
  if (cachedBlockTimestamp) {
    return cachedBlockTimestamp;
  }

  const client = getPublicClient({ chainId });

  const block = await client.getBlock({
    blockNumber: BigInt(blockNumber),
  });

  return block.timestamp.toString();
};
