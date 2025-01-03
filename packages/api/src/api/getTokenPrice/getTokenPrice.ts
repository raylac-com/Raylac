import { GetTokenUsdPriceReturnType, Token } from '@raylac/shared';
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';

const getTokenPrice = async ({
  token,
}: {
  token: Token;
}): Promise<GetTokenUsdPriceReturnType> => {
  const price = await getTokenUsdPrice({
    token,
  });

  return price;
};

export default getTokenPrice;
