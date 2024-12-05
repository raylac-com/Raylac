import {
  //  RelaySupportedCurrenciesResponseBody,
  supportedChains,
  SupportedTokensReturnType,
} from '@raylac/shared';
// import { relayApi } from '../../lib/relay';
// import NodeCache from 'node-cache';
import { getAddress, zeroAddress } from 'viem';
// import { isKnownToken, KNOWN_TOKENS } from '../../lib/knownTokes';
// import { logger } from '@raylac/shared-backend';
import { base, optimism } from 'viem/chains';

// const cache = new NodeCache({ stdTTL: 0 });

const getSupportedTokens = async (
  _chainIds: number[]
): Promise<SupportedTokensReturnType> => {
  const response: SupportedTokensReturnType = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoURI:
        'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1595348886',
      addresses: supportedChains.map(chain => ({
        chainId: chain.id,
        address: zeroAddress,
      })),
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI:
        'https://coin-images.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
      addresses: [
        {
          chainId: base.id,
          address: getAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
        },
        {
          chainId: optimism.id,
          address: getAddress('0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'),
        },
      ],
    },
  ];

  return response;

  /*
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
    .filter(token => token !== null);

  const returnValue: SupportedTokensReturnType = [];

  for (const [token, { addresses, decimals }] of Object.entries(KNOWN_TOKENS)) {
    const tokens = supportedTokens.filter(token =>
      addresses.some(
        knownToken =>
          getAddress(token.address) === knownToken.address &&
          token.chainId === knownToken.chainId
      )
    );

    if (tokens.length > 0) {
      logger.info(tokens);

      returnValue.push({
        symbol: token,
        name: token,
        decimals,
        logoURI: tokens[0].metadata.logoURI,
        addresses: tokens.map(token => ({
          chainId: token.chainId,
          address: getAddress(token.address),
        })),
      });
    }
  }

  for (const token of supportedTokens) {
    if (
      isKnownToken({
        tokenAddress: getAddress(token.address),
        chainId: token.chainId,
      })
    ) {
      continue;
    }

    returnValue.push({
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
    });
  }

  //  cache.set(`supportedTokens-${chainIds.join('-')}`, returnValue);

  return returnValue
    .sort((a, b) => b.addresses.length - a.addresses.length)
    .slice(0, 100);
    */
};

export default getSupportedTokens;
