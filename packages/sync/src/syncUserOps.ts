import { ENTRY_POINT_ADDRESS, SUTORI_PAYMASTER_ADDRESS } from '@sutori/shared';
import { publicClient } from './lib/viem';
import { parseAbiItem } from 'viem';
import prisma from './lib/prisma';
import { sleep } from './lib/utils';

const userOpEvent = parseAbiItem(
  'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)'
);

const syncUserOps = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const logs = await publicClient.getLogs({
      address: ENTRY_POINT_ADDRESS,
      event: userOpEvent,
      fromBlock: 'earliest',
      toBlock: 'safe',
      args: {
        paymaster: SUTORI_PAYMASTER_ADDRESS,
      },
    });

    for (const log of logs) {
      const { userOpHash, nonce, success, actualGasCost, actualGasUsed } =
        log.args;

      const pendingUserOpExists = await prisma.userOperationReceipt.findFirst({
        where: {
          hash: userOpHash,
        },
      });

      if (pendingUserOpExists) {
        await prisma.userOperationReceipt.update({
          data: {
            success,
            nonce,
            actualGasCost,
            actualGasUsed,
            txIndex: log.transactionIndex,
            logIndex: log.logIndex,
            blockNumber: log.blockNumber,
            chainId: publicClient.chain.id,
          },
          where: {
            hash: userOpHash,
          },
        });
      } else {
        console.log('User op not found in db:', userOpHash);
      }
    }

    await sleep(5000);
  }
};

export default syncUserOps;