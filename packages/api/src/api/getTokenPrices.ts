import {
  CoingeckoTokenPriceResponse,
  getCoingeckoClient,
} from '@raylac/shared';
import NodeCache from 'node-cache';

const cache = new NodeCache();

const TOKEN_PRICES_CACHE_KEY = 'tokenPrices';

const getTokenPrices = async () => {
  const tokenPricesInCache = cache.get<CoingeckoTokenPriceResponse | null>(
    TOKEN_PRICES_CACHE_KEY
  );

  if (tokenPricesInCache) {
    return tokenPricesInCache;
  }

  const client = getCoingeckoClient();

  const result = await client.get<CoingeckoTokenPriceResponse>(
    `/v3/simple/price?ids=ethereum&vs_currencies=usd`
  );

  cache.set(TOKEN_PRICES_CACHE_KEY, result.data, 60);

  return result.data;
};

export default getTokenPrices;
