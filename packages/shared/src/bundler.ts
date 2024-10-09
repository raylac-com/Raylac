import {
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  getUserOpHash,
  UserOperation,
} from '.';
import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getWalletClient } from './ethRpc';

export const handleOps = async ({
  userOps,
  chainId,
}: {
  userOps: UserOperation[];
  chainId: number;
}) => {
  const BUNDLER_PRIV_KEY = process.env.BUNDLER_PRIV_KEY as Hex;

  if (!BUNDLER_PRIV_KEY) {
    throw new Error('BUNDLER_PRIV_KEY is not set');
  }

  const bundlerAccount = privateKeyToAccount(BUNDLER_PRIV_KEY);

  const beneficiary = bundlerAccount.address;

  const walletClient = getWalletClient({ chainId });

  const _txHash = await walletClient.writeContract({
    address: ENTRY_POINT_ADDRESS,
    abi: EntryPointAbi,
    functionName: 'handleOps',
    account: bundlerAccount,
    args: [
      userOps.map(usrOp => ({
        ...usrOp,
        callGasLimit: BigInt(usrOp.callGasLimit),
        verificationGasLimit: BigInt(usrOp.verificationGasLimit),
        preVerificationGas: BigInt(usrOp.preVerificationGas),
        maxFeePerGas: BigInt(usrOp.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(usrOp.maxPriorityFeePerGas),
        nonce: BigInt(usrOp.nonce),
      })),
      beneficiary,
    ],
  });

  const userOpHashes = userOps.map(userOp => getUserOpHash({ userOp }));

  return userOpHashes;
};
