import {
  RelaySupportedCurrenciesResponseBody,
  supportedChains,
  SupportedTokensReturnType,
} from '@raylac/shared';
import { relayApi } from '../../lib/relay';
import { getAddress, zeroAddress } from 'viem';
import { base } from 'viem/chains';

const getSupportedTokens = async ({
  chainIds,
  searchTerm,
}: {
  chainIds: number[];
  searchTerm?: string;
}): Promise<SupportedTokensReturnType> => {
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

  const currencies = await relayApi.post<RelaySupportedCurrenciesResponseBody>(
    'currencies/v1',
    {
      chainIds,
      limit: 100,
      term: searchTerm,
    }
  );

  const knownTokenSymbols = knownTokens.map(token => token.symbol);

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

  return [...knownTokens, ...supportedTokens];
};

export default getSupportedTokens;
