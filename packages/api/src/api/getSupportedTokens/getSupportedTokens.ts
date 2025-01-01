import { relayGetCurrencies } from '../../lib/relay';
import { getAddress } from 'viem';
import { Token } from '@raylac/shared';
import { cacheTokens, getCachedTokens } from '../../lib/token';
import { logger } from '@raylac/shared-backend';

const getSupportedTokens = async ({
  chainIds,
  searchTerm,
}: {
  chainIds: number[];
  searchTerm?: string;
}): Promise<Token[]> => {
  const cachedTokens = await getCachedTokens();

  if (cachedTokens.length > 0) {
    logger.info(
      `getSupportedTokens: Cache hit. Returning ${cachedTokens.length} tokens`
    );
    return cachedTokens;
  }

  const currencies = await relayGetCurrencies({
    chainIds,
    searchTerm,
    useExternalSearch:
      searchTerm === '' || searchTerm === undefined ? false : undefined,
  });

  const supportedTokens: Token[] = currencies
    // Sort by verified status
    .sort((a, b) => Number(b.metadata.verified) - Number(a.metadata.verified))
    // Map to `Token`
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

  await cacheTokens(supportedTokens);

  return supportedTokens;
};

export default getSupportedTokens;
