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
      term: searchTerm === '' ? undefined : searchTerm,
      useExternalSearch: searchTerm !== '' && searchTerm !== undefined,
    }
  );

  const knownTokenAddresses = KNOWN_TOKENS.flatMap(token =>
    token.addresses.map(address => getAddress(address.address))
  );

  const supportedTokens: SupportedTokensReturnType = currencies.data
    .map(group => (group.length > 0 ? group[0] : null))
    .filter(token => token !== null)
    // Filter out known tokens
    .filter(token => !knownTokenAddresses.includes(getAddress(token.address)))
    // Sort by verified status
    .sort((a, b) => Number(b.metadata.verified) - Number(a.metadata.verified))
    // Map to `SupportedTokensReturnType`
    .map(token => ({
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
    }));

  const filteredKnownTokens = searchTerm
    ? KNOWN_TOKENS.filter(
        token =>
          token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : KNOWN_TOKENS;

  return [...filteredKnownTokens, ...supportedTokens];
};

export default getSupportedTokens;
