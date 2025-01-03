import { RelaySupportedCurrenciesResponseBody, Token } from '@raylac/shared';
import { logger } from '@raylac/shared-backend';
import axios from 'axios';
import { getAddress, Hex } from 'viem';

export const relayApi = axios.create({
  baseURL: 'https://api.relay.link',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const relayGetCurrencies = async ({
  chainIds,
  tokenAddress,
  tokenAddresses,
  searchTerm,
  useExternalSearch,
  limit,
}: {
  chainIds: number[];
  tokenAddress?: string;
  tokenAddresses?: string[];
  searchTerm?: string;
  useExternalSearch?: boolean;
  limit?: number;
}) => {
  let result: RelaySupportedCurrenciesResponseBody[number] = [];

  if (useExternalSearch !== undefined) {
    logger.info(`Using search with useExternalSearch: ${useExternalSearch}`);
    const response = await relayApi.post<RelaySupportedCurrenciesResponseBody>(
      'currencies/v1',
      {
        chainIds,
        address: tokenAddress,
        tokens: tokenAddresses,
        term: searchTerm,
        useExternalSearch,
        limit: limit ?? 10,
      }
    );

    result = response.data
      .filter(group => group.length > 0)
      .map(group => group[0]);
  } else {
    const promises = [
      relayApi.post<RelaySupportedCurrenciesResponseBody>('currencies/v1', {
        chainIds,
        address: tokenAddress,
        tokens: tokenAddresses,
        term: searchTerm,
        useExternalSearch: false,
        limit: limit ?? 10,
      }),
      relayApi.post<RelaySupportedCurrenciesResponseBody>('currencies/v1', {
        chainIds,
        address: tokenAddress,
        tokens: tokenAddresses,
        term: searchTerm,
        useExternalSearch: true,
        limit: limit ?? 10,
      }),
    ];

    const [internalSearchResult, externalSearchResult] =
      await Promise.all(promises);

    const combinedResult = internalSearchResult.data
      .filter(group => group.length > 0)
      .map(group => group[0]);

    for (const token of externalSearchResult.data
      .filter(group => group.length > 0)
      .map(group => group[0])) {
      // Add the external search result if it's not already in the combined result
      if (
        !combinedResult.some(
          t => t.address === token.address && t.chainId === token.chainId
        )
      ) {
        combinedResult.push(token);
      }
    }

    result = combinedResult;
  }

  return result.map(token => ({
    ...token,
    address: getAddress(token.address),
  }));
};

/**
 * Get a token from the relay API
 * @param chainId - The chain ID of the token
 * @param tokenAddress - The address of the token
 * @returns The token or null if it's not found
 */
export const relayGetToken = async ({
  chainId,
  tokenAddress,
}: {
  chainId: number;
  tokenAddress: Hex;
}): Promise<Token | null> => {
  const searchResult = await relayGetCurrencies({
    chainIds: [chainId],
    tokenAddress,
    limit: 1,
  });

  if (searchResult === undefined || searchResult.length === 0) {
    return null;
  }

  const result = searchResult[0];

  const token = {
    id: getAddress(result.address),
    symbol: result.symbol,
    name: result.name,
    decimals: result.decimals,
    logoURI: result.metadata.logoURI,
    verified: result.metadata.verified,
    addresses: [
      {
        chainId,
        address: getAddress(result.address),
      },
    ],
  };

  return token;
};
