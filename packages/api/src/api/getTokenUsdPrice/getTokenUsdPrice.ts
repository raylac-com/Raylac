import { Hex, zeroAddress } from 'viem';
import {
  getTokenPriceByAddress,
  getTokenPriceBySymbol,
} from '../../lib/alchemy';
import { Token } from '@raylac/shared';
import { redisClient } from '../../lib/redis';
import { logger } from '@raylac/shared-backend';

const PRICE_CACHE_EXPIRATION_SECONDS = 60 * 3; // 3 minutes

const getUsdPriceKey = (tokenAddress: Hex) => `usdPrice:${tokenAddress}`;

const cacheUsdPrice = async ({
  tokenAddress,
  usdPrice,
}: {
  tokenAddress: Hex;
  usdPrice: string | null;
}) => {
  if (usdPrice === null) {
    await redisClient.set(getUsdPriceKey(tokenAddress), 'null', {
      EX: PRICE_CACHE_EXPIRATION_SECONDS,
    });
  } else {
    await redisClient.set(getUsdPriceKey(tokenAddress), usdPrice, {
      EX: PRICE_CACHE_EXPIRATION_SECONDS,
    });
  }
};

const getCachedUsdPrice = async ({
  tokenAddress,
}: {
  tokenAddress: Hex;
}): Promise<number | null> => {
  const cachedPrice = await redisClient.get(getUsdPriceKey(tokenAddress));

  if (cachedPrice === null || cachedPrice === 'null') {
    return null;
  }

  return cachedPrice ? Number(cachedPrice) : null;
};

const getTokenUsdPrice = async ({
  token,
}: {
  token: Token;
}): Promise<number | null> => {
  const tokenAddress = token.addresses[0].address;
  const chainId = token.addresses[0].chainId;

  const cachedPrice = await getCachedUsdPrice({ tokenAddress });

  if (cachedPrice !== null) {
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
      usdPrice: usdPrice.value,
    });

    return Number(usdPrice.value);
  }

  const usdPrice = await getTokenPriceByAddress({
    address: tokenAddress,
    chainId,
  });

  if (usdPrice === null) {
    await cacheUsdPrice({ tokenAddress, usdPrice: null });
    return null;
  }

  logger.warn(
    `getTokenUsdPrice: Cache miss. Token: ${token.symbol} Price: ${usdPrice}`
  );

  await cacheUsdPrice({ tokenAddress, usdPrice: usdPrice });

  return Number(usdPrice);
};

export default getTokenUsdPrice;
