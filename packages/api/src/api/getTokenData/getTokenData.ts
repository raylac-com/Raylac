import * as coingecko from '../../lib/coingecko';
import { GetTokenDataReturnType, GetTokenRequestBody } from '@raylac/shared';

const getTokenData = async ({
  tokenAddress,
  chainId,
}: GetTokenRequestBody): Promise<GetTokenDataReturnType> => {
  const coinData = await coingecko.getCoinData({ tokenAddress, chainId });

  const marketCapUsd = coinData.market_data.market_cap.usd;
  const marketCapJpy = coinData.market_data.market_cap.jpy;
  const priceUsd = coinData.market_data.current_price.usd;
  const priceJpy = coinData.market_data.current_price.jpy;

  const priceChange24hUsd =
    coinData.market_data.price_change_24h_in_currency.usd;
  const priceChange24hJpy =
    coinData.market_data.price_change_24h_in_currency.jpy;

  const description = coinData.description;

  const totalVolumeUsd = coinData.market_data.total_volume.usd;
  const totalVolumeJpy = coinData.market_data.total_volume.jpy;

  return {
    marketCap: {
      usd: marketCapUsd.toString(),
      jpy: marketCapJpy.toString(),
    },
    price: {
      usd: priceUsd.toString(),
      jpy: priceJpy.toString(),
    },
    description: {
      en: description.en,
      ja: description.ja,
    },
    priceChange24h: {
      usd: priceChange24hUsd.toString(),
      jpy: priceChange24hJpy.toString(),
    },
    totalVolume: {
      usd: totalVolumeUsd.toString(),
      jpy: totalVolumeJpy.toString(),
    },
    priceChangePercent24h:
      coinData.market_data.price_change_percentage_24h.toString(),
  };
};

export default getTokenData;
