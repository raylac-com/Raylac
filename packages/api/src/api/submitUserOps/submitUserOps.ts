import {
  getChainName,
  getWebsocketClient,
  SubmitUserOpsRequestBody,
  UserOperation,
} from '@raylac/shared';
import { handleOps } from '../../lib/bundler';
import { logger } from '@raylac/shared-backend';
import prisma from '../../lib/prisma';
import { hexToBigInt } from 'viem';

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
  inputs,
  output,
}: SubmitUserOpsRequestBody) => {
  const chainIds = [...new Set(userOps.map(userOp => userOp.chainId))];

  // Submit the user ops

  const txReceipts = await Promise.all(
    chainIds.map(chainId =>
      submitUserOpsForChain({
        chainId,
        userOps: userOps.filter(userOp => userOp.chainId === chainId),
      })
    )
  );

  const tokenAddressIn = inputs[0].token.addresses.find(
    address => address.chainId === inputs[0].chainId
  )?.address;

  if (!tokenAddressIn) {
    throw new Error(
      `submitUserOps: tokenAddressIn not found for ${inputs[0].token.name} on chain ${inputs[0].chainId}`
    );
  }

  const tokenAddressOut = output.token.addresses.find(
    address => address.chainId === output.chainId
  )?.address;

  if (!tokenAddressOut) {
    throw new Error(
      `submitUserOps: tokenAddressOut not found for ${output.token.name} on chain ${output.chainId}`
    );
  }

  const amountIn = inputs.reduce(
    (acc, input) => acc + hexToBigInt(input.amount),
    BigInt(0)
  );
  const amountOut = swapQuote.details.currencyOut.amount;

  const relayerServiceFeeAmount = swapQuote.fees.relayerService.amount;
  const relayerServiceFeeUsd = swapQuote.fees.relayerService.amountUsd;
  const relayerServiceFeeTokenAddress =
    swapQuote.fees.relayerService.currency.address;
  const relayerServiceFeeChainId =
    swapQuote.fees.relayerService.currency.chainId;

  const address = userOps[0].sender;

  await prisma.swap.create({
    data: {
      address,
      tokenAddressIn,
      tokenAddressOut,
      amountIn: amountIn.toString(),
      amountOut: amountOut.toString(),
      usdAmountIn: swapQuote.details.currencyIn.amountUsd,
      usdAmountOut: swapQuote.details.currencyOut.amountUsd,
      relayerServiceFeeAmount,
      relayerServiceFeeUsd,
      relayerServiceFeeTokenAddress,
      relayerServiceFeeChainId,
      transactions: {
        createMany: {
          data: txReceipts.map(txReceipt => {
            if (txReceipt.to === null) {
              throw new Error(
                'Transaction should not be deployment transaction (to is null)'
              );
            }

            return {
              hash: txReceipt.transactionHash,
              from: txReceipt.from,
              to: txReceipt.to,
              chainId: txReceipt.chainId,
            };
          }),
        },
      },
    },
  });

  return txReceipts;
};

export default submitUserOps;
