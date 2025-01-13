import { Hex, zeroAddress } from 'viem';
import {
  getTokenPriceByAddress,
  getTokenPriceBySymbol,
} from '../../lib/alchemy';
import { MultiCurrencyValue, Token } from '@raylac/shared';
import { redisClient } from '../../lib/redis';
import { logger } from '@raylac/shared-backend';

const PRICE_CACHE_EXPIRATION_SECONDS = 60 * 3; // 3 minutes

const getTokenPriceKey = (tokenAddress: Hex) => `tokenPrice:${tokenAddress}`;

const cacheTokenPrice = async ({
  tokenAddress,
  price,
}: {
  tokenAddress: Hex;
  price: MultiCurrencyValue | null;
}) => {
  if (price === null) {
    await redisClient.set(getTokenPriceKey(tokenAddress), 'null', {
      EX: PRICE_CACHE_EXPIRATION_SECONDS,
    });
  } else {
    await redisClient.set(
      getTokenPriceKey(tokenAddress),
      JSON.stringify(price),
      {
        EX: PRICE_CACHE_EXPIRATION_SECONDS,
      }
    );
  }
};

const getCachedUsdPrice = async ({
  tokenAddress,
}: {
  tokenAddress: Hex;
}): Promise<MultiCurrencyValue | null> => {
  const cachedPrice = await redisClient.get(getTokenPriceKey(tokenAddress));

  if (cachedPrice === null || cachedPrice === 'null') {
    return null;
  }

  return cachedPrice ? JSON.parse(cachedPrice) : null;
};

const getTokenPrice = async ({
  token,
}: {
  token: Token;
}): Promise<MultiCurrencyValue | null> => {
  const tokenAddress = token.addresses[0].address;
  const chainId = token.addresses[0].chainId;

  const cachedPrice = await getCachedUsdPrice({ tokenAddress });

  if (cachedPrice !== null) {
    logger.info(
      `getTokenPrice: Cache hit. Token: ${token.symbol}: ${cachedPrice}`
    );
    return cachedPrice;
  }

  if (tokenAddress === zeroAddress) {
    const result = await getTokenPriceBySymbol('ETH');

    const usdPrice = result.prices.find(p => p.currency === 'usd');
    const jpyPrice = result.prices.find(p => p.currency === 'jpy');

    if (usdPrice === undefined) {
      throw new Error(`USD price not found for ETH`);
    }

    if (jpyPrice === undefined) {
      throw new Error(`JPY price not found for ETH`);
    }

    const multiCurrencyPrice: MultiCurrencyValue = {
      usd: usdPrice.value,
      jpy: jpyPrice.value,
    };

    await cacheTokenPrice({
      tokenAddress,
      price: multiCurrencyPrice,
    });

    return multiCurrencyPrice;
  }

  const price = await getTokenPriceByAddress({
    address: tokenAddress,
    chainId,
  });

  if (price === null) {
    await cacheTokenPrice({ tokenAddress, price: null });
    return null;
  }

  logger.warn(
    `getTokenPrice: Cache miss. Token: ${token.symbol} Price: ${price}`
  );

  await cacheTokenPrice({ tokenAddress, price });

  return price;
};

export default getTokenPrice;
