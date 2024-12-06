import {
  getChainName,
  getWebsocketClient,
  SubmitUserOpsRequestBody,
  UserOperation,
} from '@raylac/shared';
import { handleOps } from '../../lib/bundler';
import { logger } from '@raylac/shared-backend';
import prisma from '../../lib/prisma';

const submitUserOpsForChain = async ({
  chainId,
  userOps,
}: {
  chainId: number;
  userOps: UserOperation[];
}) => {
  // Call the EntryPoint's `handleOps` function
  const { txHash } = await handleOps({ userOps, chainId });

  logger.info(`submitted tx ${txHash} on ${getChainName(chainId)}`);
  const websocketClient = getWebsocketClient({ chainId });

  const txReceipt = await websocketClient.waitForTransactionReceipt({
    hash: txHash,
  });

  return { chainId, ...txReceipt };
};

const submitUserOps = async ({
  userOps,
  swapQuote,
}: SubmitUserOpsRequestBody) => {
  const chainIds = [...new Set(userOps.map(userOp => userOp.chainId))];

  const txReceipts = await Promise.all(
    chainIds.map(chainId =>
      submitUserOpsForChain({
        chainId,
        userOps: userOps.filter(userOp => userOp.chainId === chainId),
      })
    )
  );

  const tokenAddressIn = swapQuote.details.currencyIn.currency.address;
  const tokenAddressOut = swapQuote.details.currencyOut.currency.address;
  const amountIn = swapQuote.details.currencyIn.amount;
  const amountOut = swapQuote.details.currencyOut.amount;

  const address = userOps[0].sender;

  await prisma.swap.create({
    data: {
      txHash: txReceipts[0].transactionHash,
      address,
      tokenAddressIn,
      tokenAddressOut,
      amountIn,
      amountOut,
      usdAmountIn: swapQuote.details.currencyIn.amountUsd,
      usdAmountOut: swapQuote.details.currencyOut.amountUsd,
    },
  });

  return txReceipts;
};

export default submitUserOps;
