import { AlchemyTokenPriceResponse } from '@raylac/shared';
import { toAlchemyNetwork } from '../../utils';
import { Hex } from 'viem';

export const getTokenPriceMock = async ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}): Promise<AlchemyTokenPriceResponse> => {
  return {
    network: toAlchemyNetwork(chainId),
    address: tokenAddress,
    prices: [
      {
        currency: 'usd',
        value: '1.0',
        lastUpdatedAt: new Date().toISOString(),
      },
    ],
  };
};
