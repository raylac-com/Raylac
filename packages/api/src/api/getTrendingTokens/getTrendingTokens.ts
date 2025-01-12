import {
  DexScreenerPairsResponse,
  RelaySupportedCurrenciesResponseBody,
} from '@raylac/shared';
import axios from 'axios';
import { getAddress } from 'viem';
import { base } from 'viem/chains';
import { relayApi } from '../../lib/relay';

const getPairsFromDexScanners = async () => {
  const url =
    'https://api.dexscreener.com/latest/dex/tokens/0x4200000000000000000000000000000000000006';
  const response = await axios.get<DexScreenerPairsResponse>(url);

  return response.data;
};

const getTrendingTokens = async () => {
  const trendingTokens = await getPairsFromDexScanners();

  // Extract tokens from the response
  const tokenAddresses = [
    ...new Set(trendingTokens.pairs.map(pair => pair.quoteToken.address)),
  ];

  const relayCurrenciesInteranl =
    await relayApi.post<RelaySupportedCurrenciesResponseBody>('currencies/v1', {
      tokens: tokenAddresses.map(tokenAddress => `${base.id}:${tokenAddress}`),
      useExternalSearch: true,
    });

  // Map to `Token`
  const tokens = relayCurrenciesInteranl.data
    .filter(group => group.length > 0)
    .map(group => group[0])
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

  return tokens;
};

export default getTrendingTokens;
