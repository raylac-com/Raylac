import { Hex, zeroAddress } from 'viem';
import {
  getTokenPriceByAddress,
  getTokenPriceBySymbol,
} from '../../lib/alchemy';
import { Token } from '@raylac/shared';
import { redisClient } from '../../lib/redis';
import { logger } from '@raylac/shared-backend';

const PRICE_CACHE_EXPIRATION_SECONDS = 60 * 3; // 3 minutes

// JPY/USD exchange rate (to be replaced with actual API call in future)
const USD_TO_JPY_RATE = 148.5;

const getPriceKey = (tokenAddress: Hex, currency: string) =>
  `price:${currency}:${tokenAddress}`;

const cachePrice = async ({
  tokenAddress,
  price,
  currency,
}: {
  tokenAddress: Hex;
  price: string | null;
  currency: string;
}) => {
  if (price === null) {
    await redisClient.set(getPriceKey(tokenAddress, currency), 'null', {
      EX: PRICE_CACHE_EXPIRATION_SECONDS,
    });
  } else {
    await redisClient.set(getPriceKey(tokenAddress, currency), price, {
      EX: PRICE_CACHE_EXPIRATION_SECONDS,
    });
  }
};

const getCachedPrice = async ({
  tokenAddress,
  currency,
}: {
  tokenAddress: Hex;
  currency: string;
}): Promise<number | null> => {
  const cachedPrice = await redisClient.get(
    getPriceKey(tokenAddress, currency)
  );

  if (cachedPrice === null || cachedPrice === 'null') {
    return null;
  }

  return cachedPrice ? Number(cachedPrice) : null;
};

const getTokenPrice = async ({
  token,
  currency = 'usd',
}: {
  token: Token;
  currency?: string;
}): Promise<number | null> => {
  const tokenAddress = token.addresses[0].address;
  const chainId = token.addresses[0].chainId;

  const cachedPrice = await getCachedPrice({ tokenAddress, currency });

  if (cachedPrice !== null) {
    logger.info(
      `getTokenPrice: Cache hit. Token: ${token.symbol}: ${cachedPrice} ${currency.toUpperCase()}`
    );
    return cachedPrice;
  }

  if (tokenAddress === zeroAddress) {
    const result = await getTokenPriceBySymbol('ETH');
    const basePrice = result.prices.find(p => p.currency === 'usd');

    if (!basePrice) {
      throw new Error(`USD price not found for ETH`);
    }

    // Convert to requested currency if needed
    const price =
      currency === 'jpy'
        ? (Number(basePrice.value) * USD_TO_JPY_RATE).toString()
        : basePrice.value;

    await cachePrice({
      tokenAddress,
      price,
      currency,
    });

    return Number(price);
  }

  const basePrice = await getTokenPriceByAddress({
    address: tokenAddress,
    chainId,
  });

  if (basePrice === null) {
    await cachePrice({ tokenAddress, price: null, currency });
    return null;
  }

  // Convert to requested currency if needed
  const price =
    currency === 'jpy'
      ? (Number(basePrice) * USD_TO_JPY_RATE).toString()
      : basePrice;

  logger.warn(
    `getTokenPrice: Cache miss. Token: ${token.symbol} Price: ${price} ${currency.toUpperCase()}`
  );

  await cachePrice({ tokenAddress, price, currency });

  return Number(price);
};

export default getTokenPrice;
