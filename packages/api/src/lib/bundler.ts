import {
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  getUserOpHash,
  UserOperation,
  getWalletClient,
} from '@raylac/shared';
import { Hex } from 'viem';
import { privateKeyToAccount, nonceManager } from 'viem/accounts';
import { logger } from '../utils';

const BUNDLER_PRIV_KEY = process.env.BUNDLER_PRIV_KEY as Hex;

if (!BUNDLER_PRIV_KEY) {
  throw new Error('BUNDLER_PRIV_KEY is not set');
}

export const bundlerAccount = privateKeyToAccount(BUNDLER_PRIV_KEY, {
  nonceManager,
});

export const handleOps = async ({
  userOps,
  chainId,
}: {
  userOps: UserOperation[];
  chainId: number;
}) => {
  const beneficiary = bundlerAccount.address;

  const walletClient = getWalletClient({ chainId });

  const start = Date.now();
  const txHash = await walletClient.writeContract({
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
  const end = Date.now();

  logger.info(`EntryPoint.handleOps ${end - start}ms`);

  const userOpHashes = userOps.map(userOp => getUserOpHash({ userOp }));

  return { txHash, userOpHashes };
};
