import {
  findTokenByAddress,
  RelaySupportedCurrenciesResponseBody,
  supportedChains,
  SupportedTokensReturnType,
} from '@raylac/shared';
import { getAddress, Hex } from 'viem';
import { relayApi } from '../../lib/relay';
import { KNOWN_TOKENS } from '../../lib/knownTokes';

const getToken = async ({
  tokenAddress,
}: {
  tokenAddress: Hex;
}): Promise<SupportedTokensReturnType[number]> => {
  const knownToken = findTokenByAddress({
    tokens: KNOWN_TOKENS,
    tokenAddress,
  });

  if (knownToken) {
    return knownToken;
  }

  const internalSearchResult =
    await relayApi.post<RelaySupportedCurrenciesResponseBody>('currencies/v1', {
      chainIds: supportedChains.map(chain => chain.id),
      address: tokenAddress,
      limit: 1,
      useExternalSearch: false,
    });

  const externalSearchResult =
    await relayApi.post<RelaySupportedCurrenciesResponseBody>('currencies/v1', {
      chainIds: supportedChains.map(chain => chain.id),
      address: tokenAddress,
      limit: 1,
      useExternalSearch: true,
    });

  const searchResult =
    internalSearchResult.data[0] || externalSearchResult.data[0];

  if (searchResult === undefined) {
    throw new Error('Token not found');
  }

  const token = searchResult[0];

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
