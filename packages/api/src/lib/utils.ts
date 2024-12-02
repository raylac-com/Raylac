import { getPublicClient } from '@raylac/shared';

import { ChainGasInfo } from '@raylac/shared';
import { getMaxPriorityFeePerGas } from './erc4337';

/**
 * Get the gas info for all supported chains
 */
export const getGasInfo = async ({
  chainIds,
}: {
  chainIds: number[];
}): Promise<ChainGasInfo[]> => {
  const gasInfo: ChainGasInfo[] = [];
  for (const chainId of chainIds) {
    const client = getPublicClient({ chainId });
    const block = await client.getBlock({ blockTag: 'latest' });
    const maxPriorityFeePerGas = await getMaxPriorityFeePerGas({ chainId });

    if (block.baseFeePerGas === null) {
      throw new Error('baseFeePerGas is null');
    }

    gasInfo.push({
      chainId,
      baseFeePerGas: block.baseFeePerGas,
      maxPriorityFeePerGas,
    });
  }

  return gasInfo;
};
