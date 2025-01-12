import { chainIdToCoingeckoId, CoingeckoCoinData } from '@raylac/shared';
import axios from 'axios';
import { Hex } from 'viem';

export const getCoinData = async ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}) => {
  const url = `https://api.coingecko.com/api/v3/coins/${chainIdToCoingeckoId(
    chainId
  )}/contract/${tokenAddress}`;
  const response = await axios.get<CoingeckoCoinData>(url);

  return response.data;
};
