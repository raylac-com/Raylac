import { toAlchemyNetwork } from '../utils';
import { Alchemy, HistoricalPriceInterval } from 'alchemy-sdk';
import BigNumber from 'bignumber.js';
import { ALCHEMY_API_KEY } from './envVars';
import { MultiCurrencyValue } from '@raylac/shared';
import { Hex } from 'viem';
import { getUsdExchangeRate } from './exchangeRate';

export const getAlchemyClient = (chainId: number) => {
  return new Alchemy({
    apiKey: ALCHEMY_API_KEY,
    network: toAlchemyNetwork(chainId),
  });
};

export const getTokenPriceByAddress = async ({
  chainId,
  address,
}: {
  chainId: number;
  address: Hex;
}): Promise<MultiCurrencyValue | null> => {
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

    const usdPrice = data[data.length - 1].value;
    const exchangeRate = await getUsdExchangeRate();

    const jpyPrice = new BigNumber(usdPrice)
      .times(new BigNumber(exchangeRate.jpy))
      .toString();

    return {
      usd: usdPrice,
      jpy: jpyPrice,
    };
  } catch (err: any) {
    if (err.message.includes('not found')) {
      return null;
    }

    throw err;
  }
};
