import {
  getERC20TokenBalance,
  getPublicClient,
  getWalletClient,
  SendTransactionRequestBody,
  sleep,
  Token,
} from '@raylac/shared';
import { bundlerAccount } from '../../lib/bundler';
import { logger } from '@raylac/shared-backend';
import { Hex, zeroAddress } from 'viem';
import { getTokenAddressOnChain } from '../../utils';

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
  for (const signedBridgeStep of signedBridgeSteps) {
    const publicClient = getPublicClient({
      chainId: signedBridgeStep.tx.chainId,
    });
    const walletClient = getWalletClient({
      chainId: signedBridgeStep.tx.chainId,
    });

    const gas = BigInt(signedBridgeStep.tx.gas);
    const maxFeePerGas = BigInt(signedBridgeStep.tx.maxFeePerGas);

    const fundAmount = gas * maxFeePerGas * BigInt(2);

    logger.info(
      `Funding ${fundAmount} on chain ${signedBridgeStep.tx.chainId} to ${sender}`
    );

    const fundingTx = await walletClient.sendTransaction({
      account: bundlerAccount,
      to: sender,
      value: fundAmount,
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: fundingTx,
    });

    if (receipt.status !== 'success') {
      throw new Error('Funding transaction failed');
    }

    await walletClient.sendRawTransaction({
      serializedTransaction: signedBridgeStep.signature,
    });
  }

  const publicClient = getPublicClient({
    chainId: signedTransfer.tx.chainId,
  });

  const walletClient = getWalletClient({
    chainId: signedTransfer.tx.chainId,
  });

  const finalTransferGasCost =
    BigInt(signedTransfer.tx.gas) *
    BigInt(signedTransfer.tx.maxFeePerGas) *
    BigInt(2);

  // Fund the final transfer
  const fundingTx = await walletClient.sendTransaction({
    account: bundlerAccount,
    to: sender,
    value: finalTransferGasCost,
  });

  logger.info(
    `Funding ${finalTransferGasCost} on chain ${signedTransfer.tx.chainId} to ${sender} ${fundingTx}`
  );

  const fundingReceipt = await publicClient.waitForTransactionReceipt({
    hash: fundingTx,
  });

  if (fundingReceipt.status !== 'success') {
    throw new Error('Funding transaction on final chain failed');
  }

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

  return finalTransferReceipt;
};

export default sendTransaction;
