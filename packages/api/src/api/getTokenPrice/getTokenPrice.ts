import { Hex, zeroAddress } from 'viem';
import {
  getTokenPriceByAddress,
  getTokenPriceBySymbol,
} from '../../lib/alchemy';
import { AlchemyTokenPriceResponse } from '@raylac/shared';

const getTokenPrice = async ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}): Promise<AlchemyTokenPriceResponse> => {
  if (tokenAddress === zeroAddress) {
    return getTokenPriceBySymbol('ETH');
  }

  const result = await getTokenPriceByAddress({
    address: tokenAddress,
    chainId,
  });

  const usdPrice = result.prices.find(p => p.currency === 'usd');

  // Return the price as 0 if the last update of the price is more than 24 hours ago
  if (
    usdPrice &&
    new Date(usdPrice.lastUpdatedAt).getTime() <
      Date.now() - 24 * 60 * 60 * 1000
  ) {
    return {
      ...result,
      prices: [
        {
          ...usdPrice,
          value: '0',
        },
      ],
    };
  }

  return result;
};

export default getTokenPrice;
