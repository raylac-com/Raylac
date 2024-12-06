import {
  RelaySupportedCurrenciesResponseBody,
  //  RelaySupportedCurrenciesResponseBody,
  supportedChains,
  SupportedTokensReturnType,
} from '@raylac/shared';
import { relayApi } from '../../lib/relay';
import NodeCache from 'node-cache';
import { getAddress, zeroAddress } from 'viem';
import { base } from 'viem/chains';

const cache = new NodeCache({ stdTTL: 0 });

const getSupportedTokens = async (
  chainIds: number[]
): Promise<SupportedTokensReturnType> => {
  const knownTokens: SupportedTokensReturnType = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoURI:
        'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
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
        /*
        {
          chainId: optimism.id,
          address: getAddress('0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'),
        },
        */
      ],
    },
  ];
  /*

  const cached = cache.get<SupportedTokensReturnType>(
    `supportedTokens-${chainIds.join('-')}`
  );

  if (cached) {
    return cached;
  }
    */

  const currencies = await relayApi.post<RelaySupportedCurrenciesResponseBody>(
    'currencies/v1',
    {
      chainIds,
      verified: true,
    }
  );

  const supportedTokens = currencies.data
    .map(group => (group.length > 0 ? group[0] : null))
    .filter(token => token !== null);

  const knownTokenSymbols = knownTokens.map(token => token.symbol);

  const returnValue: SupportedTokensReturnType = knownTokens;

  for (const token of supportedTokens) {
    if (knownTokenSymbols.includes(token.symbol)) {
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

  cache.set(`supportedTokens-${chainIds.join('-')}`, returnValue);

  return returnValue;
};

export default getSupportedTokens;
