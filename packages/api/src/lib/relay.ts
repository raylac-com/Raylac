import {
  RelayGetRequestsReturnType,
  RelaySupportedCurrenciesResponseBody,
  Token,
} from '@raylac/shared';
import { logger } from '@raylac/shared-backend';
import axios from 'axios';
import { getAddress, Hex } from 'viem';
import { redisClient } from './redis';

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
        limit: limit ?? 30,
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
        limit: limit ?? 30,
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

const getCachedRelayRequest = async ({
  txHash,
}: {
  txHash: Hex;
}): Promise<RelayGetRequestsReturnType['requests'][number] | null> => {
  const cachedRequest = await redisClient.get(`relay:request:${txHash}`);

  if (cachedRequest) {
    return JSON.parse(cachedRequest);
  }

  return null;
};

export const relayGetRequest = async ({
  txHash,
}: {
  txHash: Hex;
}): Promise<RelayGetRequestsReturnType['requests'][number]> => {
  const cachedRequest = await getCachedRelayRequest({ txHash });

  if (cachedRequest) {
    return cachedRequest;
  }

  const response = await relayApi.get<RelayGetRequestsReturnType>(
    `requests/v2?hash=${txHash}`
  );

  if (response.data.requests.length === 0) {
    throw new Error(`No request found for ${txHash}`);
  }

  const relayRequestData = response.data.requests[0];

  if (relayRequestData.status !== 'pending') {
    await redisClient.set(
      `relay:request:${txHash}`,
      JSON.stringify(relayRequestData)
    );
  }

  return relayRequestData;
};
