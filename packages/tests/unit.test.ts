import { describe, expect, test } from 'vitest';
import { getBlockNumFromTimestamp } from '@raylac/sync';
import supportedChains from '@raylac/shared/out/supportedChains';
import { getPublicClient } from '@raylac/shared';

describe('unit tests', () => {
  describe('getBlockNumFromTimestamp', () => {
    supportedChains.map(chain => {
      test(`should return the correct block number for ${chain.name}`, async () => {
        const client = getPublicClient({ chainId: chain.id });

        const latestBlock = await client.getBlock({
          blockTag: 'latest',
        });

        const searchTimestamp =
          Number(latestBlock.timestamp) - 60 * 60 * 24 * 5;
        const blockNumber = await getBlockNumFromTimestamp({
          chainId: chain.id,
          timestamp: searchTimestamp,
        });

        const block = await client.getBlock({
          blockNumber: blockNumber,
        });

        const diff = Math.abs(Number(block.timestamp) - searchTimestamp);
        expect(diff).toBeLessThan(60);
      });
    });
  });
});
