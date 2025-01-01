import { Hex, zeroAddress } from 'viem';
import {
  getTokenPriceByAddress,
  getTokenPriceBySymbol,
} from '../../lib/alchemy';
import { Token } from '@raylac/shared';
import { redisClient } from '../../lib/redis';
import { logger } from '@raylac/shared-backend';

const cacheUsdPrice = async ({
  tokenAddress,
  usdPrice,
}: {
  tokenAddress: Hex;
  usdPrice: number | 'notfound';
}) => {
  if (usdPrice === 'notfound') {
    await redisClient.set(`usdPrice:${tokenAddress}`, 'notfound');
  } else {
    await redisClient.set(`usdPrice:${tokenAddress}`, usdPrice);
  }
};

const getCachedUsdPrice = async ({
  tokenAddress,
}: {
  tokenAddress: Hex;
}): Promise<number | 'notfound' | null> => {
  const cachedPrice = await redisClient.get(`usdPrice:${tokenAddress}`);

  if (cachedPrice === 'notfound') {
    return 'notfound';
  }

  return cachedPrice ? Number(cachedPrice) : null;
};

const getTokenUsdPrice = async ({
  token,
}: {
  token: Token;
}): Promise<number | 'notfound'> => {
  const tokenAddress = token.addresses[0].address;
  const chainId = token.addresses[0].chainId;

  const cachedPrice = await getCachedUsdPrice({ tokenAddress });

  if (cachedPrice) {
    logger.info(
      `getTokenUsdPrice: Cache hit. Token: ${token.symbol}: ${cachedPrice}`
    );
    return cachedPrice;
  }

  if (tokenAddress === zeroAddress) {
    const result = await getTokenPriceBySymbol('ETH');

    const usdPrice = result.prices.find(p => p.currency === 'usd');

    if (!usdPrice) {
      throw new Error(`USD price not found for ETH`);
    }

    await cacheUsdPrice({
      tokenAddress,
      usdPrice: Number(usdPrice.value),
    });

    return Number(usdPrice.value);
  }

  const result = await getTokenPriceByAddress({
    address: tokenAddress,
    chainId,
  });

  const usdPriceData = result.prices.find(p => p.currency === 'usd');

  if (usdPriceData === undefined) {
    await cacheUsdPrice({ tokenAddress, usdPrice: 'notfound' });
    return 'notfound';
  }

  // Return the price as 0 if the last update of the price is more than 6 hours ago
  if (
    usdPriceData &&
    new Date(usdPriceData.lastUpdatedAt).getTime() <
      Date.now() - 6 * 60 * 60 * 1000
  ) {
    await cacheUsdPrice({ tokenAddress, usdPrice: 0 });
    return 0;
  }

  const usdPrice = Number(usdPriceData.value);

  logger.warn(
    `getTokenUsdPrice: Cache miss. Token: ${token.symbol} Price: ${usdPrice}`
  );

  await cacheUsdPrice({ tokenAddress, usdPrice });

  return usdPrice;
};

export default getTokenUsdPrice;
