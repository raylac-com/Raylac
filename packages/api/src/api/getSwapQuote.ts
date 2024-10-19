import { get0xClient, ZeroExSwapQuoteResponse } from '@raylac/shared';
import { Hex } from 'viem';

const getSwapQuote = async ({
  chainId,
  sellToken,
  sellAmount,
  buyToken,
  taker,
}: {
  chainId: number;
  sellToken: Hex;
  sellAmount: string;
  buyToken: Hex;
  taker: Hex;
}) => {
  const zeroExClient = get0xClient();

  const params = new URLSearchParams({
    chainId: chainId.toString(),
    buyToken,
    sellToken,
    sellAmount,
    taker,
  });

  const quote = await zeroExClient.get<ZeroExSwapQuoteResponse>(
    `/swap/permit2/quote?${params.toString()}`
  );

  return quote.data;
};

export default getSwapQuote;
