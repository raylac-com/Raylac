import { Token } from '@raylac/shared';
import getBaseTokenPrice from '../getBaseTokenPrice/getBaseTokenPrice';

export interface GetTokenPriceReturnType {
  price: number | null;
  currency: string;
}

const getTokenPrice = async ({
  token,
  currency = 'usd',
}: {
  token: Token;
  currency?: string;
}): Promise<GetTokenPriceReturnType> => {
  const basePrice = await getBaseTokenPrice({
    token,
    currency: currency.toLowerCase(),
  });

  return {
    price: basePrice,
    currency: currency.toUpperCase(),
  };
};

export default getTokenPrice;
