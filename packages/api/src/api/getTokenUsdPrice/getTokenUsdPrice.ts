import { Hex, zeroAddress } from 'viem';
import {
  getTokenPriceByAddress,
  getTokenPriceBySymbol,
} from '../../lib/alchemy';
import { Token } from '@raylac/shared';
import { redisClient } from '../../lib/redis';
import { logger } from '@raylac/shared-backend';

const PRICE_CACHE_EXPIRATION_SECONDS = 60 * 3; // 3 minutes

const cacheUsdPrice = async ({
  tokenAddress,
  usdPrice,
}: {
  tokenAddress: Hex;
  usdPrice: number | 'notfound';
}) => {
  if (usdPrice === 'notfound') {
    await redisClient.set(`usdPrice:${tokenAddress}`, 'notfound', {
      EX: PRICE_CACHE_EXPIRATION_SECONDS,
    });
  } else {
    await redisClient.set(`usdPrice:${tokenAddress}`, usdPrice, {
      EX: PRICE_CACHE_EXPIRATION_SECONDS,
    });
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

  const usdPrice = await getTokenPriceByAddress({
    address: tokenAddress,
    chainId,
  });

  if (usdPrice === null) {
    await cacheUsdPrice({ tokenAddress, usdPrice: 'notfound' });
    return 'notfound';
  }

  logger.warn(
    `getTokenUsdPrice: Cache miss. Token: ${token.symbol} Price: ${usdPrice}`
  );

  await cacheUsdPrice({ tokenAddress, usdPrice: Number(usdPrice) });

  return Number(usdPrice);
};

export default getTokenUsdPrice;
