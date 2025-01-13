import { Hex, zeroAddress } from 'viem';
import { getTokenPriceByAddress } from '../../lib/alchemy';
import { MultiCurrencyValue, Token } from '@raylac/shared';
import { redisClient } from '../../lib/redis';
import { logger } from '@raylac/shared-backend';
import { mainnet } from 'viem/chains';

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

const getCachePrice = async ({
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

  const cachedPrice = await getCachePrice({ tokenAddress });

  if (cachedPrice !== null) {
    logger.info(`getTokenPrice: Cache hit. Token: ${token.symbol}`);
    return cachedPrice;
  }

  if (tokenAddress === zeroAddress) {
    const tokenPrice = await getTokenPriceByAddress({
      chainId: mainnet.id,
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // wETH price
    });

    await cacheTokenPrice({
      tokenAddress,
      price: tokenPrice,
    });

    return tokenPrice;
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
