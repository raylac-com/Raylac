import { RelaySupportedCurrenciesResponseBody } from '@raylac/shared';
import { logger } from '@raylac/shared-backend';
import axios from 'axios';
import { getAddress } from 'viem';

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
    logger.info('Using combined search');
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
