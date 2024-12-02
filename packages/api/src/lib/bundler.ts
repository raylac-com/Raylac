import {
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  UserOperation,
  getWalletClient,
  getUserOpHash,
} from '@raylac/shared';
import { privateKeyToAccount, nonceManager } from 'viem/accounts';
import { logger } from '@raylac/shared-backend';
import { BUNDLER_PRIV_KEY } from './envVars';

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
