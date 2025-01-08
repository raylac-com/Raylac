import { toAlchemyNetwork } from '../utils';
import { Alchemy, HistoricalPriceInterval } from 'alchemy-sdk';
import { ALCHEMY_API_KEY } from './envVars';
import { AlchemyTokenPriceResponse } from '@raylac/shared';
import { Hex } from 'viem';
import axios from 'axios';

export const getAlchemyClient = (chainId: number) => {
  return new Alchemy({
    apiKey: ALCHEMY_API_KEY,
    network: toAlchemyNetwork(chainId),
  });
};

export const getTokenPriceBySymbol = async (symbol: string) => {
  const url = `https://api.g.alchemy.com/prices/v1/tokens/by-symbol?symbols=${symbol}`;

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${ALCHEMY_API_KEY}`,
  };

  const response = await axios.get<{ data: AlchemyTokenPriceResponse[] }>(url, {
    headers: headers,
  });

  return response.data.data[0];
};

export const getTokenPriceByAddress = async ({
  chainId,
  address,
}: {
  chainId: number;
  address: Hex;
}): Promise<string | null> => {
  const alchemyClient = getAlchemyClient(chainId);

  const startTime = new Date().getTime() / 1000 - 24 * 60 * 60; // Yesterday
  const endTime = new Date().getTime() / 1000; // Today

  try {
    const result = await alchemyClient.prices.getHistoricalPriceByAddress(
      toAlchemyNetwork(chainId),
      address,
      startTime,
      endTime,
      HistoricalPriceInterval.ONE_DAY
    );

    const data = result.data;

    if (data.length === 0) {
      return null;
    }

    return data[data.length - 1].value;
  } catch (err: any) {
    if (err.message.includes('not found')) {
      return null;
    }

    throw err;
  }
};

export const getTokenPrices = async ({
  tokenAddresses,
}: {
  tokenAddresses: { address: Hex; chainId: number }[];
}): Promise<AlchemyTokenPriceResponse[]> => {
  if (tokenAddresses.length > 25) {
    throw new Error('Alchemy only supports 25 token addresses at a time');
  }

  const url = `https://api.g.alchemy.com/prices/v1/tokens/by-address`;

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${ALCHEMY_API_KEY}`,
  };

  const response = await axios.post<{ data: AlchemyTokenPriceResponse[] }>(
    url,
    {
      addresses: tokenAddresses.map(token => ({
        address: token.address,
        network: toAlchemyNetwork(token.chainId),
      })),
    },
    {
      headers: headers,
    }
  );

  return response.data.data;
};
