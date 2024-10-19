import {
  ACCOUNT_IMPL_DEPLOYED_BLOCK,
  bigIntMin,
  ENTRY_POINT_ADDRESS,
  EntryPointAbi,
  ERC20Abi,
  getPublicClient,
  getTokenId,
  isTokenSupported,
  RAYLAC_PAYMASTER_ADDRESS,
} from '@raylac/shared';
import { decodeEventLog, Hex, Log, parseAbiItem, parseEventLogs } from 'viem';
import prisma from './lib/prisma';
import supportedChains from '@raylac/shared/out/supportedChains';
import { updateJobLatestSyncedBlock, upsertTransaction } from './utils';
import { sleep } from './lib/utils';
import { Prisma } from '@prisma/client';
import logger from './lib/logger';
import { handleERC20TransferLog } from './syncERC20Transfers';

const userOpEvent = parseAbiItem(
  'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)'
);

/**
 * Get the highest block number of the synched user operations.
 */
const getLatestSynchedUserOpBlock = async (
  chainId: number
): Promise<bigint | null> => {
  const syncJobStatus = await prisma.syncStatus.findFirst({
    select: {
      lastSyncedBlockNum: true,
    },
    where: {
      job: 'UserOps',
      chainId,
    },
  });

  return syncJobStatus?.lastSyncedBlockNum ?? null;
};

const upsertUserOp = async ({
  userOpHash,
  sender,
  paymaster,
  nonce,
  success,
  actualGasCost,
  actualGasUsed,
  chainId,
  txHash,
}: {
  userOpHash: Hex;
  sender: Hex;
  paymaster: Hex;
  nonce: bigint;
  success: boolean;
  actualGasCost: bigint;
  actualGasUsed: bigint;
  chainId: number;
  txHash: Hex;
}) => {
  const data: Prisma.UserOperationCreateInput = {
    chainId,
    hash: userOpHash,
    sender,
    paymaster,
    nonce: Number(nonce),
    success,
    actualGasCost,
    actualGasUsed,
    Transaction: {
      connect: {
        hash: txHash,
      },
    },
  };

  await prisma.userOperation.upsert({
    create: data,
    update: data,
    where: {
      hash: userOpHash,
    },
  });
};

export const handleUserOpEvent = async ({
  log,
  chainId,
}: {
  log: Log<bigint, number, false>;
  chainId: number;
}) => {
  const decodedLog = decodeEventLog({
    abi: EntryPointAbi,
    data: log.data,
    topics: log.topics,
  });

  if (decodedLog.eventName !== 'UserOperationEvent') {
    throw new Error('Event name is not `UserOperationEvent`');
  }

  const { args } = decodedLog;

  const txHash = log.transactionHash;

  const userOpHash = args.userOpHash;
  const sender = args.sender;
  const paymaster = args.paymaster;
  const nonce = args.nonce;
  const success = args.success;
  const actualGasCost = args.actualGasCost;
  const actualGasUsed = args.actualGasUsed;

  await upsertTransaction({
    txHash,
    chainId,
  });

  await upsertUserOp({
    userOpHash,
    sender,
    paymaster,
    nonce,
    success,
    actualGasCost,
    actualGasUsed,
    chainId,
    txHash,
  });

  const client = getPublicClient({ chainId });
  const txReceipt = await client.getTransactionReceipt({
    hash: txHash,
  });

  const transferLogs = parseEventLogs({
    abi: ERC20Abi,
    logs: txReceipt.logs,
    eventName: 'Transfer',
  });

  await Promise.all(
    transferLogs.map(async log => {
      const tokenAddress = log.address;

      if (
        !isTokenSupported({
          chainId,
          tokenAddress,
        })
      ) {
        return;
      }

      const tokenId = getTokenId({
        chainId,
        tokenAddress: log.address,
      });
      console.log({ tokenId, tokenAddress: log.address });

      await handleERC20TransferLog({ log, tokenId, chainId });
    })
  );
};

/**
 * Sync user operations for the given chain,
 * from either the latest synched block or the finalized block (from the earlier block)
 * to the latest block
 */
export const syncUserOpsForChain = async (chainId: number) => {
  const client = getPublicClient({ chainId });

  // eslint-disable-next-line security/detect-object-injection
  const accountDeployedBlock = ACCOUNT_IMPL_DEPLOYED_BLOCK[chainId];

  if (!accountDeployedBlock) {
    throw new Error(
      `ACCOUNT_IMPL_DEPLOYED_BLOCK not found for chain ${chainId}`
    );
  }

  const latestSynchedBlock =
    (await getLatestSynchedUserOpBlock(chainId)) || accountDeployedBlock;

  const finalizedBlockNumber = await client.getBlock({
    blockTag: 'finalized',
  });

  if (finalizedBlockNumber.number === null) {
    throw new Error('Finalized block number is null');
  }

  const fromBlock = bigIntMin([
    latestSynchedBlock,
    finalizedBlockNumber.number,
  ]);

  const toBlock = await client.getBlockNumber();

  logger.info(
    `Syncing UserOperations from block ${fromBlock.toLocaleString()} to ${toBlock.toLocaleString()} on chain ${chainId}`
  );
  logger.info(`((${(toBlock - fromBlock).toLocaleString()}) blocks)`);

  const chunkSize = 10000n;

  for (
    let startBlock = fromBlock;
    startBlock <= toBlock;
    startBlock += chunkSize + 1n
  ) {
    const endBlock =
      startBlock + chunkSize <= toBlock ? startBlock + chunkSize : toBlock;

    logger.info(
      `Fetching logs from block ${startBlock.toLocaleString()} to ${endBlock.toLocaleString()} on chain ${chainId}`
    );

    const chunkLogs = await client.getLogs({
      address: ENTRY_POINT_ADDRESS,
      event: userOpEvent,
      args: {
        paymaster: RAYLAC_PAYMASTER_ADDRESS,
      },
      fromBlock: startBlock,
      toBlock: endBlock,
    });

    for (const log of chunkLogs) {
      await handleUserOpEvent({
        log,
        chainId,
      });
    }

    await updateJobLatestSyncedBlock({
      chainId,
      syncJob: 'UserOps',
      blockNumber: endBlock,
    });
  }
};

const syncUserOpsByPaymaster = async () => {
  while (true) {
    for (const chainId of supportedChains.map(chain => chain.id)) {
      await syncUserOpsForChain(chainId);
    }

    await sleep(15 * 1000); // Sleep for 15 seconds
  }
};

const syncUserOps = async () => {
  await syncUserOpsByPaymaster();
};

export default syncUserOps;
