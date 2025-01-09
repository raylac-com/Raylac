import { relayGetCurrencies } from '../../lib/relay';
import { getAddress, isAddress } from 'viem';
import { KNOWN_TOKENS, supportedChains, Token } from '@raylac/shared';
import { getToken } from '../../lib/token';
import * as chains from 'viem/chains';

const knownTokenAddresses = KNOWN_TOKENS.flatMap(token =>
  token.addresses.map(address => getAddress(address.address))
);

const chainPriorities = [
  chains.base.id,
  chains.optimism.id,
  chains.mainnet.id,
  chains.arbitrum.id,
] as number[];

const getSupportedTokens = async ({
  chainIds,
  searchTerm,
}: {
  chainIds: number[];
  searchTerm?: string;
}): Promise<Token[]> => {
  const isContractAddressSearch =
    searchTerm &&
    isAddress(searchTerm, {
      strict: false,
    });

  if (isContractAddressSearch) {
    // If a contract address is provided, return the token

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

  if (searchTerm === undefined || searchTerm === '') {
    // If search term is not provided, return all known tokens
    return KNOWN_TOKENS;
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

  const sortedSearchResults = searchResults
    .sort(
      (a, b) =>
        chainPriorities.indexOf(a.addresses[0].chainId) -
        chainPriorities.indexOf(b.addresses[0].chainId)
    )
    .sort(
      // Sort by verified status
      (a, b) => Number(b.verified) - Number(a.verified)
    )
    // Sort by known token status
    .sort(
      (a, b) => Number(b.isKnownToken ? 1 : 0) - Number(a.isKnownToken ? 1 : 0)
    );

  return sortedSearchResults;
};

export default getSupportedTokens;
