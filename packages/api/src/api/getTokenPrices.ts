import { CoingeckoTokenPriceResponse } from '@raylac/shared';
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache();

const TOKEN_PRICES_CACHE_KEY = 'tokenPrices';

const getTokenPrices = async () => {
  const tokenPricesInCache = cache.get(TOKEN_PRICES_CACHE_KEY);

  if (tokenPricesInCache) {
    return tokenPricesInCache;
  }

  const result = await axios.get<CoingeckoTokenPriceResponse>(
    `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`
  );

  cache.set(TOKEN_PRICES_CACHE_KEY, result.data, 60);

  return result.data;
};

export default getTokenPrices;
