import axios from 'axios';
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
import NodeCache from 'node-cache';

if (!EXCHANGE_RATE_API_KEY) {
  throw new Error('EXCHANGE_RATE_API_KEY is not set');
}

const cache = new NodeCache();

const USD_TO_JPY_CACHE_KEY = 'usdToJpy';

const getUsdToJpy = async () => {
  // Checking the cache
  const cachedUsdToJpy = cache.get(USD_TO_JPY_CACHE_KEY) as number | undefined;

  // If the value is in the cache, return it
  if (cachedUsdToJpy) {
    return cachedUsdToJpy;
  }

  const res = await axios.get(
    `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/USD`
  );

  const rates = res.data.conversion_rates;

  if (!rates) {
    throw new Error('Failed to get exchange rates');
  }

  const usdToJpy = rates.JPY as number;

  // Setting the value in the cache
  cache.set(USD_TO_JPY_CACHE_KEY, usdToJpy, 60000); // Expires in 60 seconds

  return usdToJpy;
};

export default getUsdToJpy;
