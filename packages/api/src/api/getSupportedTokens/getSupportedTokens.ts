import {
  RelaySupportedCurrenciesResponseBody,
  SupportedTokensReturnType,
} from '@raylac/shared';
import { relayApi } from '../../lib/relay';
import NodeCache from 'node-cache';
import { Hex } from 'viem';

const cache = new NodeCache({ stdTTL: 60 * 60 });

const getSupportedTokens = async (
  chainIds: number[]
): Promise<SupportedTokensReturnType> => {
  const cached = cache.get<SupportedTokensReturnType>(
    `supportedTokens-${chainIds.join('-')}`
  );

  if (cached) {
    return cached;
  }

  const currencies = await relayApi.post<RelaySupportedCurrenciesResponseBody>(
    'currencies/v1',
    {
      chainIds,
    }
  );

  const supportedTokens = currencies.data
    .map(group => (group.length > 0 ? group[0] : null))
    .filter(token => token !== null)
    // Map to `SupportedTokensReturnType`
    .map(token => ({
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoURI: token.metadata.logoURI,
      tokenAddress: token.address as Hex,
    }));

  // TODO: Group the tokens by tokenAddress

  cache.set(`supportedTokens-${chainIds.join('-')}`, supportedTokens);

  return supportedTokens;
};

export default getSupportedTokens;
