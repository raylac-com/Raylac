import { Hex, zeroAddress } from 'viem';
import {
  getTokenPriceByAddress,
  getTokenPriceBySymbol,
} from '../../lib/alchemy';
import { AlchemyTokenPriceResponse } from '@raylac/shared';

const getTokenPrice = async ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}): Promise<AlchemyTokenPriceResponse> => {
  if (tokenAddress === zeroAddress) {
    return getTokenPriceBySymbol('ETH');
  }

  return getTokenPriceByAddress({
    address: tokenAddress,
    chainId,
  });
};

export default getTokenPrice;
