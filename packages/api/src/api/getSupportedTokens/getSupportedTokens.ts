import { SupportedTokensReturnType } from '@raylac/shared';
import { relayGetCurrencies } from '../../lib/relay';
import { getAddress } from 'viem';
import { KNOWN_TOKENS } from '@raylac/shared';

const getSupportedTokens = async ({
  chainIds,
  searchTerm,
}: {
  chainIds: number[];
  searchTerm?: string;
}): Promise<SupportedTokensReturnType> => {
  const currencies = await relayGetCurrencies({
    chainIds,
    searchTerm,
    useExternalSearch:
      searchTerm === '' || searchTerm === undefined ? false : undefined,
  });

  const knownTokenAddresses = KNOWN_TOKENS.flatMap(token =>
    token.addresses.map(address => getAddress(address.address))
  );

  const supportedTokens: SupportedTokensReturnType = currencies
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
