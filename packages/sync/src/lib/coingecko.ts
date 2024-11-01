import { getCoingeckoClient, toCoingeckoTokenId } from '@raylac/shared';
import NodeCache from 'node-cache';
import { logger } from '../utils';

const coingeckoClient = getCoingeckoClient();

interface CoingeckoMarketChartResponse {
  prices: [number, number][];
}

interface TokenPriceAtTime {
  timestamp: number;
  price: number;
}

const cache = new NodeCache();

const tryGettingFromCache = (
  coingeckoId: string,
  timestamp: number
): number | undefined => {
  const cachedPrices = cache.get<TokenPriceAtTime[]>(coingeckoId);

  if (!cachedPrices) {
    return undefined;
  }

  // If we find a price that is within 1 hour of the timestamp, return it
  const result = cachedPrices.find(
    price => Math.abs(price.timestamp - timestamp * 1000) <= 3600 * 1000
  );

  if (!result) {
    logger.info(
      `No cached price for ${coingeckoId} at ${timestamp}, fetching from Coingecko`
    );
  }

  return result?.price;
};

export const getTokenPriceAtTime = async (
  tokenId: string,
  timestamp: number
) => {
  const coingeckoId = toCoingeckoTokenId(tokenId);

  const cachedPrice = tryGettingFromCache(coingeckoId, timestamp);

  if (cachedPrice) {
    return cachedPrice;
  }

  const tokenPrice = await coingeckoClient.get<CoingeckoMarketChartResponse>(
    `v3/coins/${coingeckoId}/market_chart`,
    {
      params: {
        vs_currency: 'usd',
        days: 30,
      },
    }
  );

  const prices = tokenPrice.data.prices.map(([timestamp, price]) => ({
    timestamp,
    price,
  }));

  cache.set(coingeckoId, prices);

  const closestPrice = prices.reduce((closest, current) => {
    return Math.abs(current.timestamp - timestamp * 1000) <
      Math.abs(closest.timestamp - timestamp * 1000)
      ? current
      : closest;
  });

  return closestPrice.price;
};
