import { SubmitUserOpsRequestBody } from '@raylac/shared';
import prisma from '../../lib/prisma';

const submitUserOps = async ({
  userOps,
  swapQuote,
}: SubmitUserOpsRequestBody) => {
  const tokenAddressIn = swapQuote.details.currencyIn.currency.address;
  const tokenAddressOut = swapQuote.details.currencyOut.currency.address;
  const amountIn = swapQuote.details.currencyIn.amount;
  const amountOut = swapQuote.details.currencyOut.amount;

  const address = userOps[0].sender;

  await prisma.swap.create({
    data: {
      txHash: '0x123',
      address,
      tokenAddressIn,
      tokenAddressOut,
      amountIn,
      amountOut,
      usdAmountIn: swapQuote.details.currencyIn.amountUsd,
      usdAmountOut: swapQuote.details.currencyOut.amountUsd,
    },
  });

  return [];
};

export default submitUserOps;
