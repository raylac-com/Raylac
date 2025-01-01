import { zeroAddress } from 'viem';
import {
  getTokenPriceByAddress,
  getTokenPriceBySymbol,
} from '../../lib/alchemy';
import NodeCache from 'node-cache';
import { Token } from '@raylac/shared';

const cache = new NodeCache({ stdTTL: 60 });

const getTokenUsdPrice = async ({
  token,
}: {
  token: Token;
}): Promise<number> => {
  const tokenAddress = token.addresses[0].address;
  const chainId = token.addresses[0].chainId;

  const cachedPrice = cache.get<number | undefined>(tokenAddress);

  if (cachedPrice) {
    return cachedPrice;
  }

  if (tokenAddress === zeroAddress) {
    const result = await getTokenPriceBySymbol('ETH');

    cache.set(tokenAddress, result);

    const usdPrice = result.prices.find(p => p.currency === 'usd');

    if (!usdPrice) {
      throw new Error(`USD price not found for ETH`);
    }

    return Number(usdPrice.value);
  }

  const result = await getTokenPriceByAddress({
    address: tokenAddress,
    chainId,
  });

  const usdPrice = result.prices.find(p => p.currency === 'usd');

  if (!usdPrice) {
    throw new Error(
      `USD price not found for ${token.symbol} (${tokenAddress}) on chain ${chainId}`
    );
  }

  // Return the price as 0 if the last update of the price is more than 24 hours ago
  if (
    usdPrice &&
    new Date(usdPrice.lastUpdatedAt).getTime() <
      Date.now() - 24 * 60 * 60 * 1000
  ) {
    cache.set(tokenAddress, 0);
    return 0;
  }

  cache.set(tokenAddress, Number(usdPrice.value));

  return Number(usdPrice.value);
};

export default getTokenUsdPrice;
