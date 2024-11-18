import {
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  getUserOpHash,
  UserOperation,
  getWalletClient,
  getChainName,
} from '@raylac/shared';
import { logger } from '@raylac/shared-backend';
import { parseEther } from 'viem';
import { getTestClient } from './utils';

export const handleOps = async ({
  userOps,
  chainId,
}: {
  userOps: UserOperation[];
  chainId: number;
}) => {
  const bundler = '0x3333333333333333333333333333333333333333';

  const beneficiary = bundler;

  const testClient = await getTestClient({ chainId });
  const walletClient = getWalletClient({ chainId });

  const start = Date.now();

  await testClient.setBalance({
    address: bundler,
    value: parseEther('1000000'),
  });

  await testClient.impersonateAccount({
    address: bundler,
  });

  const txHash = await walletClient.writeContract({
    address: ENTRY_POINT_ADDRESS,
    abi: EntryPointAbi,
    functionName: 'handleOps',
    account: bundler,
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

/**
 * Submit UserOperations to the bundler and return the tx hashes.
 * This functions groups the user ops by chain and submits them in the respective chains.
 */
export const submitUserOps = async ({
  userOps,
}: {
  userOps: UserOperation[];
}) => {
  const chainIds = [...new Set(userOps.map(u => u.chainId))];

  // Mapping of chainId to UserOps to submit
  const userOpsByChainId: Record<number, UserOperation[]> = {};

  // Group user ops by chain id
  for (const userOp of userOps) {
    userOpsByChainId[userOp.chainId] = [
      ...(userOpsByChainId[userOp.chainId] ?? []),
      userOp,
    ];
  }

  const results = await Promise.all(
    chainIds.map(async chainId => {
      const { txHash } = await handleOps({
        // eslint-disable-next-line security/detect-object-injection
        userOps: userOpsByChainId[chainId],
        chainId,
      });

      logger.debug(`Submitted UserOperations on ${getChainName(chainId)}`, {
        txHash,
      });

      return txHash;
    })
  );

  return results;
};
