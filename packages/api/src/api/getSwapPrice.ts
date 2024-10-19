import { get0xClient, ZeroExSwapPriceResponse } from '@raylac/shared';
import { Hex } from 'viem';

const getSwapPrice = async ({
  chainId,
  sellToken,
  sellAmount,
  buyToken,
}: {
  chainId: number;
  sellToken: Hex;
  sellAmount: string;
  buyToken: Hex;
}) => {
  const zeroExClient = get0xClient();

  const params = new URLSearchParams({
    sellToken,
    buyToken,
    sellAmount,
    chainId: chainId.toString(),
  });

  const price = await zeroExClient.get<ZeroExSwapPriceResponse>(
    `/swap/permit2/price?${params.toString()}`
  );

  return price.data;
};

export default getSwapPrice;
