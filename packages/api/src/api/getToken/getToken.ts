import { findTokenByAddress, Token } from '@raylac/shared';
import { getAddress, Hex } from 'viem';
import { relayGetCurrencies } from '../../lib/relay';
import { KNOWN_TOKENS } from '@raylac/shared';
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 60 * 60 * 24,
});

const getToken = async ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}): Promise<Token> => {
  const knownToken = findTokenByAddress({
    tokens: KNOWN_TOKENS,
    tokenAddress,
  });

  if (knownToken) {
    return knownToken;
  }

  const cachedToken = cache.get<Token>(tokenAddress);

  if (cachedToken) {
    return cachedToken;
  }

  const searchResult = await relayGetCurrencies({
    chainIds: [chainId],
    tokenAddress,
    limit: 1,
  });

  if (searchResult === undefined || searchResult.length === 0) {
    throw new Error('Token not found');
  }

  const token = searchResult[0];

  cache.set(tokenAddress, token);

  return {
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: token.metadata.logoURI,
    verified: token.metadata.verified,
    addresses: [
      {
        chainId: token.chainId,
        address: getAddress(token.address),
      },
    ],
  };
};

export default getToken;
