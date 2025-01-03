import { KNOWN_TOKENS, Token } from '@raylac/shared';
import { redisClient } from './redis';
import { Hex } from 'viem';
import { relayGetToken } from './relay';

export const cacheToken = async ({
  tokenAddress,
  token,
}: {
  tokenAddress: Hex;
  token: Token;
}) => {
  await redisClient.set(tokenAddress, JSON.stringify(token));
};

export const cacheTokens = async (tokens: Token[]) => {
  await redisClient.mSet(
    Object.fromEntries(
      tokens.map(token => [token.addresses[0].address, JSON.stringify(token)])
    )
  );
};

export const getCachedToken = async (
  tokenAddress: Hex
): Promise<Token | null> => {
  const token = await redisClient.get(tokenAddress);
  return token ? JSON.parse(token) : null;
};

export const getCachedTokens = async (): Promise<Token[]> => {
  const keys = await redisClient.keys('*');
  if (keys.length === 0) {
    return [];
  }

  const tokens = await redisClient.mGet(keys);
  return tokens
    .map(token => {
      try {
        const parsed = JSON.parse(token as string);
        if (parsed.addresses !== undefined) {
          return parsed;
        }
        return null;
      } catch (_error) {
        return null;
      }
    })
    .filter(item => item !== null);
};

export const getToken = async ({
  chainId,
  tokenAddress,
}: {
  chainId: number;
  tokenAddress: Hex;
}): Promise<Token | null> => {
  const knownToken = KNOWN_TOKENS.find(token =>
    token.addresses.some(address => address.address === tokenAddress)
  );

  if (knownToken) {
    return knownToken;
  }

  const cachedToken = await getCachedToken(tokenAddress);
  if (cachedToken) {
    return cachedToken;
  }

  const token = await relayGetToken({
    chainId,
    tokenAddress,
  });

  if (token) {
    cacheToken({ tokenAddress, token });
  }

  return token;
};
