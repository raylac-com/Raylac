import { getPublicClient } from '@raylac/shared';

import { ChainGasInfo } from '@raylac/shared';
import { getMaxPriorityFeePerGas } from './erc4337';
import { Hex } from 'viem';

/**
 * Get the gas info for all supported chains
 */
export const getGasInfo = async ({
  chainId,
}: {
  chainId: number;
}): Promise<ChainGasInfo> => {
  const client = getPublicClient({ chainId });
  const block = await client.getBlock({ blockTag: 'latest' });
  const maxPriorityFeePerGas = await getMaxPriorityFeePerGas({ chainId });

  if (block.baseFeePerGas === null) {
    throw new Error('baseFeePerGas is null');
  }

  const gasInfo: ChainGasInfo = {
    chainId,
    baseFeePerGas: block.baseFeePerGas,
    maxPriorityFeePerGas,
  };

  return gasInfo;
};

export const getNonce = async ({
  chainId,
  address,
}: {
  chainId: number;
  address: Hex;
}) => {
  const publicClient = getPublicClient({
    chainId,
  });

  return await publicClient.getTransactionCount({
    address,
  });
};
