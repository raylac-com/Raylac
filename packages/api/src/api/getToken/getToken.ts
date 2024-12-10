import {
  findTokenByAddress,
  RelaySupportedCurrenciesResponseBody,
  SupportedTokensReturnType,
} from '@raylac/shared';
import { getAddress, Hex } from 'viem';
import { relayApi } from '../../lib/relay';
import { KNOWN_TOKENS } from '../../lib/knownTokes';

const getToken = async ({
  tokenAddress,
}: {
  tokenAddress: Hex;
}): Promise<SupportedTokensReturnType[number]> => {
  const knownToken = findTokenByAddress({
    tokens: KNOWN_TOKENS,
    tokenAddress,
  });

  if (knownToken) {
    return knownToken;
  }

  const currencies = await relayApi.post<RelaySupportedCurrenciesResponseBody>(
    'currencies/v1',
    {
      address: tokenAddress,
      limit: 1,
    }
  );

  if (currencies.data[0] === undefined) {
    throw new Error('Token not found');
  }

  const token = currencies.data[0][0];

  return {
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
  };
};

export default getToken;
