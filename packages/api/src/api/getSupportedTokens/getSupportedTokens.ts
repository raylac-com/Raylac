import { relayGetCurrencies } from '../../lib/relay';
import { getAddress, isAddress } from 'viem';
import { KNOWN_TOKENS, supportedChains, Token } from '@raylac/shared';
import { getToken } from '../../lib/token';

const knownTokenAddresses = KNOWN_TOKENS.flatMap(token =>
  token.addresses.map(address => getAddress(address.address))
);

const getSupportedTokens = async ({
  chainIds,
  searchTerm,
}: {
  chainIds: number[];
  searchTerm?: string;
}): Promise<Token[]> => {
  if (
    searchTerm &&
    isAddress(searchTerm, {
      strict: false,
    })
  ) {
    const tokens = await Promise.all(
      supportedChains.map(chain =>
        getToken({
          chainId: chain.id,
          tokenAddress: searchTerm,
        })
      )
    );

    return (
      tokens
        .filter(token => token !== null)
        // There might be duplicates as the nature of the Relay API
        .filter(
          (token, index, self) =>
            index === self.findIndex(t => t.id === token.id)
        )
    );
  }

  const currencies = await relayGetCurrencies({
    chainIds,
    searchTerm,
    useExternalSearch:
      searchTerm === '' || searchTerm === undefined ? false : undefined,
  });

  const supportedTokens: Token[] = currencies
    // Filter out tokens that are in the known tokens list
    .filter(token => !knownTokenAddresses.includes(getAddress(token.address)))
    // Sort by verified status
    .sort((a, b) => Number(b.metadata.verified) - Number(a.metadata.verified))
    // Map to `Token`
    .map(token => ({
      id: getAddress(token.address),
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

  const result = [...supportedTokens, ...KNOWN_TOKENS];

  const searchResults = searchTerm
    ? result.filter(
        token =>
          token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          token.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : result;

  return searchResults;
};

export default getSupportedTokens;
