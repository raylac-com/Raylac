import {
  RelaySupportedCurrenciesResponseBody,
  SupportedTokensReturnType,
} from '@raylac/shared';
import { getAddress, Hex } from 'viem';
import { relayApi } from '../../lib/relay';
import { KNOWN_TOKENS } from '../../lib/knownTokes';

const getToken = async ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}): Promise<SupportedTokensReturnType[number]> => {
  const knownToken = KNOWN_TOKENS.find(knownToken =>
    knownToken.addresses.some(({ address }) => address === tokenAddress)
  );

  if (knownToken) {
    return knownToken;
  }

  const currencies = await relayApi.post<RelaySupportedCurrenciesResponseBody>(
    'currencies/v1',
    {
      chainIds: [chainId],
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
        chainId,
        address: getAddress(token.address),
      },
    ],
  };
};

export default getToken;
