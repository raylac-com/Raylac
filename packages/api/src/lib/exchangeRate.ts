import { ExchangeRateResponse, MultiCurrencyValue } from '@raylac/shared';
import { EXCHANGE_RATE_API_KEY } from './envVars';
import axios from 'axios';
import { redisClient } from './redis';

const cacheKey = 'exchangeRate';
const cacheDuration = 60 * 60; // 1 hour

const getCachedExchangeRate = async (): Promise<MultiCurrencyValue | null> => {
  const cachedExchangeRate = await redisClient.get(cacheKey);

  if (cachedExchangeRate) {
    return JSON.parse(cachedExchangeRate) as MultiCurrencyValue;
  }

  return null;
};

const cacheExchangeRate = async (
  exchangeRate: MultiCurrencyValue
): Promise<void> => {
  await redisClient.set(cacheKey, JSON.stringify(exchangeRate), {
    EX: cacheDuration,
  });
};

export const getUsdExchangeRate = async (): Promise<MultiCurrencyValue> => {
  const cachedExchangeRate = await getCachedExchangeRate();

  if (cachedExchangeRate) {
    return cachedExchangeRate;
  }

  const response = await axios.get<ExchangeRateResponse>(
    `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/USD`
  );
  const data = response.data;

  const exchangeRate: MultiCurrencyValue = {
    usd: data.conversion_rates.USD.toString(),
    jpy: data.conversion_rates.JPY.toString(),
  };

  await cacheExchangeRate(exchangeRate);

  return exchangeRate;
};
