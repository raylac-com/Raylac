import { KNOWN_TOKENS, Token } from '@raylac/shared';
import { redisClient } from './redis';
import { Hex } from 'viem';
import { relayGetToken } from './relay';

const getTokenKey = (tokenAddress: Hex) => `token:${tokenAddress}`;

export const cacheToken = async ({
  tokenAddress,
  token,
}: {
  tokenAddress: Hex;
  token: Token;
}) => {
  await redisClient.set(getTokenKey(tokenAddress), JSON.stringify(token));
};

export const getCachedToken = async (
  tokenAddress: Hex
): Promise<Token | null> => {
  const token = await redisClient.get(getTokenKey(tokenAddress));
  return token ? JSON.parse(token) : null;
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
