import { Hex } from 'viem';
import { getTokenPriceByAddress } from '../../lib/alchemy';

const getTokenPrice = async ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}) => {
  return getTokenPriceByAddress({
    address: tokenAddress,
    chainId,
  });
};

export default getTokenPrice;
