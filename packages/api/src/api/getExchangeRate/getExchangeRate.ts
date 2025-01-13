import { GetExchangeRateReturnType } from '@raylac/shared';
import { getUsdExchangeRate } from '../../lib/exchangeRate';

const getExchangeRate = async (): Promise<GetExchangeRateReturnType> => {
  return await getUsdExchangeRate();
};

export default getExchangeRate;
