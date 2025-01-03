import { GetTokenUsdPriceReturnType, Token } from '@raylac/shared';

export const getTokenPriceMock = async ({
  token: _token,
}: {
  token: Token;
}): Promise<GetTokenUsdPriceReturnType> => {
  return 1345.54444444444;
};
