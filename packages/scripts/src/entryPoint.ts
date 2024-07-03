import 'dotenv/config';
import { walletClient } from './client';
import publicClient from './client';
import {
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  UserOperation,
} from '@sutori/shared';
import {
  BaseError,
  ContractFunctionRevertedError,
  Hex,
  encodeFunctionData,
  zeroAddress,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const BUNDLER_PRIV_KEY = process.env.BUNDLER_PRIV_KEY;
if (!BUNDLER_PRIV_KEY) {
  throw new Error('BUNDLER_PRIV_KEY is not set');
}

const bundler = privateKeyToAccount(BUNDLER_PRIV_KEY as Hex);

export const handleOps = async ({
  ops,
  beneficiary,
}: {
  ops: UserOperation[];
  beneficiary: Hex;
}) => {
  const op = ops[0];

  console.log({ op });

  const data = encodeFunctionData({
    abi: EntryPointAbi,
    functionName: 'handleOps',
    args: [
      [
        {
          sender: op.sender,
          nonce: op.nonce,
          initCode: op.initCode,
          callData: op.callData,
          callGasLimit: op.callGasLimit,
          verificationGasLimit: op.verificationGasLimit,
          preVerificationGas: op.preVerificationGas,
          maxFeePerGas: op.maxFeePerGas,
          maxPriorityFeePerGas: op.maxPriorityFeePerGas,
          paymasterAndData: op.paymasterAndData,
          signature: op.signature,
        },
      ],
      beneficiary,
    ],
  });

  console.log('Data:', data);

  await walletClient.writeContract({
    address: ENTRY_POINT_ADDRESS,
    account: bundler,
    abi: EntryPointAbi,
    functionName: 'handleOps',
    args: [
      [
        {
          sender: op.sender,
          nonce: op.nonce,
          initCode: op.initCode,
          callData: op.callData,
          callGasLimit: op.callGasLimit,
          verificationGasLimit: op.verificationGasLimit,
          preVerificationGas: op.preVerificationGas,
          maxFeePerGas: op.maxFeePerGas,
          maxPriorityFeePerGas: op.maxPriorityFeePerGas,
          paymasterAndData: op.paymasterAndData,
          signature: op.signature,
        },
      ],
      beneficiary,
    ],
  });
};

export const getUserOpHash = async (userOp: UserOperation) => {
  const userOpHash = await publicClient.readContract({
    address: ENTRY_POINT_ADDRESS,
    abi: EntryPointAbi,
    functionName: 'getUserOpHash',
    args: [
      {
        sender: userOp.sender,
        nonce: userOp.nonce,
        initCode: userOp.initCode,
        callData: userOp.callData,
        callGasLimit: userOp.callGasLimit,
        verificationGasLimit: userOp.verificationGasLimit,
        preVerificationGas: userOp.preVerificationGas,
        maxFeePerGas: userOp.maxFeePerGas,
        maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
        paymasterAndData: userOp.paymasterAndData,
        signature: userOp.signature,
      },
    ],
  });

  return userOpHash;
};

export const getSenderAddress = async (
  initCode: Hex
): Promise<Hex | undefined> => {
  try {
    // Simulate contract call from a random account
    const account = await privateKeyToAccount(generatePrivateKey());

    await publicClient.simulateContract({
      address: ENTRY_POINT_ADDRESS,
      account,
      abi: EntryPointAbi,
      functionName: 'getSenderAddress',
      args: [initCode],
    });
  } catch (err: any) {
    if (err instanceof BaseError) {
      const revertError = err.walk(
        err => err instanceof ContractFunctionRevertedError
      );
      if (revertError instanceof ContractFunctionRevertedError) {
        const errorName = revertError.data?.errorName ?? '';
        if (errorName === 'SenderAddressResult') {
          if (revertError.data?.args?.length !== 1) {
            throw new Error(
              'Unexpected number of arguments in SenderAddressResult'
            );
          }

          const senderAddress = revertError.data.args[0] as Hex;

          if (senderAddress == zeroAddress) {
            throw new Error('Sender address is zero');
          }

          return senderAddress;
        }
      }
    }

    throw err;
  }
};
