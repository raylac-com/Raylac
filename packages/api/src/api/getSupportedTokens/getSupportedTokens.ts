import {
  RelaySupportedCurrenciesResponseBody,
  SupportedTokensReturnType,
} from '@raylac/shared';
import { relayApi } from '../../lib/relay';
import { getAddress } from 'viem';
import { KNOWN_TOKENS } from '../../lib/knownTokes';

const getSupportedTokens = async ({
  chainIds,
  searchTerm,
}: {
  chainIds: number[];
  searchTerm?: string;
}): Promise<SupportedTokensReturnType> => {
  const currencies = await relayApi.post<RelaySupportedCurrenciesResponseBody>(
    'currencies/v1',
    {
      chainIds,
      limit: 100,
      term: searchTerm,
    }
  );

  const knownTokenSymbols = KNOWN_TOKENS.map(token => token.symbol);

  const supportedTokens: SupportedTokensReturnType = currencies.data
    .map(group => (group.length > 0 ? group[0] : null))
    .filter(token => token !== null)
    // Filter out known tokens
    .filter(token => !knownTokenSymbols.includes(token.symbol))
    // Sort by verified status
    .sort((a, b) => Number(b.metadata.verified) - Number(a.metadata.verified))
    // Map to `SupportedTokensReturnType`
    .map(token => ({
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoURI: token.metadata.logoURI,
      addresses: [
        {
          chainId: token.chainId,
          address: getAddress(token.address),
        },
      ],
    }));

  return [...KNOWN_TOKENS, ...supportedTokens];
};

export default getSupportedTokens;
