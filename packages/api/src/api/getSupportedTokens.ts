import { RelaySupportedCurrenciesResponseBody } from '@raylac/shared';
import { relayApi } from '../lib/relay';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60 * 60 });

const getSupportedTokens = async (chainIds: number[]) => {
  const cached = cache.get<RelaySupportedCurrenciesResponseBody[number]>(
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
    .filter(token => token !== null);

  cache.set(`supportedTokens-${chainIds.join('-')}`, supportedTokens);

  return supportedTokens;
};

export default getSupportedTokens;
