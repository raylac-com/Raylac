import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  ENTRY_POINT_ADDRESS,
  getPublicClient,
} from '@raylac/shared';
import { getAddress, Hex, parseAbiItem } from 'viem';
import prisma from './lib/prisma';
import { base, baseSepolia } from 'viem/chains';
import { sleep } from './lib/utils';
import { Prisma } from '@prisma/client';

const userOpEvent = parseAbiItem(
  'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)'
);

const syncUserOpsForAddress = async (senderAddress: Hex) => {
  for (const chainId of [baseSepolia.id, base.id]) {
    const client = getPublicClient({ chainId });

    // Get the latest synched user operation receipt for the address

    const latestUserOp = await prisma.userOperation.findFirst({
      select: {
        Transaction: {
          select: {
            blockNumber: true,
          },
        },
      },
      where: { sender: senderAddress, chainId },
      orderBy: {
        Transaction: {
          blockNumber: 'desc',
        },
      },
    });

    const fromBlock = latestUserOp?.Transaction?.blockNumber
      ? BigInt(latestUserOp.Transaction.blockNumber) + BigInt(1)
      : ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId];

    if (!fromBlock) {
      throw new Error(
        `No deployed block for the account implementation on chain ${chainId}`
      );
    }

    const logs = await client.getLogs({
      address: ENTRY_POINT_ADDRESS,
      event: userOpEvent,
      fromBlock,
      toBlock: 'safe',
      args: {
        sender: senderAddress,
      },
    });

    console.log(
      `Found ${logs.length} UserOperationEvent logs for address ${senderAddress} on chain ${chainId}`
    );

    const publicClient = getPublicClient({ chainId });

    for (const log of logs) {
      const {
        userOpHash,
        sender,
        nonce,
        success,
        actualGasCost,
        actualGasUsed,
        paymaster,
      } = log.args;

      const data: Prisma.UserOperationCreateInput = {
        sender: getAddress(sender!),
        hash: userOpHash!,
        nonce: nonce!,
        actualGasCost: actualGasCost!,
        actualGasUsed: actualGasUsed!,
        success: success!,
        chainId: publicClient.chain.id,
        paymaster: getAddress(paymaster!),
        Transaction: {
          connectOrCreate: {
            where: {
              hash: log.transactionHash,
            },
            create: {
              hash: log.transactionHash,
              blockNumber: log.blockNumber,
              chainId,
            },
          },
        },
      };

      console.log(`Upserting UserOperation ${userOpHash}`);
      await prisma.userOperation.upsert({
        where: {
          hash: userOpHash!,
        },
        update: data,
        create: data,
      });
    }
  }
};

/**
 * Fetch and save the logs of the user operations that were paid by the Raylac paymaster.
 * An empty user operation receipt should have been created in the database for each user operation,
 * when the user sent a transfer.
 */
const syncUserOps = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const addresses = await prisma.userStealthAddress.findMany({
      select: {
        address: true,
      },
    });

    for (const address of addresses) {
      await syncUserOpsForAddress(address.address as Hex);
    }

    await sleep(10000); // 10 seconds
  }
};

export default syncUserOps;
