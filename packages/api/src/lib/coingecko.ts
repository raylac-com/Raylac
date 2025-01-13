import { chainIdToCoingeckoId, CoingeckoCoinData } from '@raylac/shared';
import axios from 'axios';
import { Hex } from 'viem';
import { redisClient } from './redis';

const getCacheKey = ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}) => {
  return `coingecko:${chainId}:${tokenAddress}`;
};

/**
 * Save Coingecko coin data to redis
 */
const saveCoinDataToCache = async ({
  tokenAddress,
  chainId,
  data,
}: {
  tokenAddress: Hex;
  chainId: number;
  data: CoingeckoCoinData;
}) => {
  const cacheKey = getCacheKey({ tokenAddress, chainId });
  await redisClient.set(cacheKey, JSON.stringify(data));
};

/**
 * Get Coingecko coin data from redis
 */
const getCoinDataFromCache = async ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}): Promise<CoingeckoCoinData | null> => {
  const cacheKey = getCacheKey({ tokenAddress, chainId });
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  return null;
};

export const getCoinData = async ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}): Promise<CoingeckoCoinData> => {
  const cachedData = await getCoinDataFromCache({
    tokenAddress,
    chainId,
  });

  if (cachedData) {
    return cachedData;
  }

  const url = `https://api.coingecko.com/api/v3/coins/${chainIdToCoingeckoId(
    chainId
  )}/contract/${tokenAddress}`;
  const response = await axios.get<CoingeckoCoinData>(url);

  await saveCoinDataToCache({
    tokenAddress,
    chainId,
    data: response.data,
  });

  return response.data;
};
