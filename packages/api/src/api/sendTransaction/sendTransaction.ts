import {
  getERC20TokenBalance,
  getPublicClient,
  getWalletClient,
  SendTransactionRequestBody,
  SignedBridgeStep,
  sleep,
  Token,
} from '@raylac/shared';
import { logger } from '@raylac/shared-backend';
import { Hex, zeroAddress } from 'viem';
import { getTokenAddressOnChain } from '../../utils';
import prisma from '../../lib/prisma';

const getTokenBalance = async ({
  chainId,
  address,
  token,
}: {
  chainId: number;
  address: Hex;
  token: Token;
}) => {
  const client = getPublicClient({
    chainId,
  });

  const tokenAddress = getTokenAddressOnChain(token, chainId);

  const balance =
    tokenAddress === zeroAddress
      ? await client.getBalance({
          address,
        })
      : await getERC20TokenBalance({
          chainId,
          address,
          contractAddress: tokenAddress,
        });

  return balance;
};

const waitForBalance = async ({
  chainId,
  address,
  balance,
  token,
}: {
  chainId: number;
  address: Hex;
  balance: bigint;
  token: Token;
}) => {
  while (true) {
    const currentBalance = await getTokenBalance({
      chainId,
      address,
      token,
    });

    logger.info(
      `Waiting for balance ${currentBalance} to be greater than ${balance} on chain ${chainId}`
    );

    if (currentBalance >= balance) {
      break;
    }

    await sleep(1000);
  }
};

const sendTransaction = async ({
  signedBridgeSteps,
  signedTransfer,
  sender,
  token,
  amount,
}: SendTransactionRequestBody) => {
  const bridgeTxs: {
    signedBridgeStep: SignedBridgeStep;
    txHash: Hex;
  }[] = [];

  for (const signedBridgeStep of signedBridgeSteps) {
    const walletClient = getWalletClient({
      chainId: signedBridgeStep.tx.chainId,
    });

    const txHash = await walletClient.sendRawTransaction({
      serializedTransaction: signedBridgeStep.signature,
    });

    bridgeTxs.push({
      signedBridgeStep,
      txHash,
    });
  }

  const publicClient = getPublicClient({
    chainId: signedTransfer.tx.chainId,
  });

  const walletClient = getWalletClient({
    chainId: signedTransfer.tx.chainId,
  });

  await waitForBalance({
    chainId: signedTransfer.tx.chainId,
    address: sender,
    balance: BigInt(amount),
    token,
  });

  const finalTransferTxHash = await walletClient.sendRawTransaction({
    serializedTransaction: signedTransfer.signature,
  });

  const finalTransferReceipt = await publicClient.waitForTransactionReceipt({
    hash: finalTransferTxHash,
  });

  logger.info(
    `Final transfer ${finalTransferTxHash} on chain ${signedTransfer.tx.chainId}`
  );

  if (finalTransferReceipt.status !== 'success') {
    throw new Error('Final transfer failed');
  }

  await prisma.transfer.create({
    data: {
      txHash: finalTransferTxHash,
      from: sender,
      to: signedTransfer.transferDetails.to,
      destinationChainId: signedTransfer.tx.chainId,
      amount: amount,
      tokenAddress: token.addresses[0].address,
      bridges: {
        createMany: {
          data: bridgeTxs.map(bridgeTx => ({
            transactionHash: bridgeTx.txHash,
            fromChainId: bridgeTx.signedBridgeStep.bridgeDetails.fromChainId,
            toChainId: bridgeTx.signedBridgeStep.bridgeDetails.toChainId,
            address: sender,
            amountIn: bridgeTx.signedBridgeStep.bridgeDetails.amountIn,
            amountOut: bridgeTx.signedBridgeStep.bridgeDetails.amountOut,
            tokenAddress: token.addresses[0].address,
            bridgeFeeAmount: bridgeTx.signedBridgeStep.bridgeDetails.bridgeFee,
            bridgeFeeUsd: bridgeTx.signedBridgeStep.bridgeDetails.bridgeFeeUsd,
          })),
        },
      },
    },
  });

  return finalTransferReceipt;
};

export default sendTransaction;
