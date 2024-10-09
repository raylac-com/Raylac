// import { upsertTransfersForTx } from '../src/syncOutgoingTransfers';
// import { baseSepolia } from 'viem/chains';

import { expect, describe, it } from 'vitest';
import prisma from '../src/lib/prisma';
import { baseSepolia } from 'viem/chains';
import { Hex, parseUnits } from 'viem';
import { handleUserOpEvent } from '../src/syncUserOps';
import { getPublicClient, USER_OP_EVENT_SIG } from '@raylac/shared';

/**
 * Delete all traces and transfers for a given transferIds
 */
const deleteTransfer = async (transferId: string) => {
  await prisma.trace.deleteMany({
    where: {
      transferId,
    },
  });

  await prisma.transfer.deleteMany({
    where: {
      transferId,
    },
  });
};

/**
 * Delete the transaction for a given txHash
 */
const deleteTransaction = async (txHash: string) => {
  await prisma.transaction.deleteMany({
    where: {
      hash: txHash,
    },
  });
};

const getUserOpEventLog = async (txHash: Hex) => {
  const receipt = await client.getTransactionReceipt({
    hash: txHash,
  });

  const log = receipt?.logs.find(log => log.topics[0] === USER_OP_EVENT_SIG);

  if (!log) {
    throw new Error('No log found');
  }

  return log;
};

/**
 * Get traces for a given transferId
 */
const getTraces = async (transferId: string) => {
  return await prisma.trace.findMany({
    select: {
      from: true,
      to: true,
      amount: true,
      transactionHash: true,
      transferId: true,
      tokenId: true,
      Transaction: {
        select: {
          block: {
            select: {
              number: true,
              chainId: true,
            },
          },
        },
      },
    },
    where: {
      transferId,
    },
  });
};

const client = getPublicClient({ chainId: baseSepolia.id });

describe('syncUserOps', () => {
  it('should sync native eth transfer from userOps', async () => {
    // Transaction hash of a native eth transfer
    const txHash =
      '0x033b9c711c236d9b829d5a62693b2f87e82f34590de4866e0dab3bd39793323c';

    const EXPECTED_FROM_ADDRESS = '0x468bDbD3572A41e840caa8459632d4296e3E5018';
    const EXPECTED_TO_ADDRESS = '0xB00d4FfF035bd51BAd863ca9F185a41F41a9e8b5';
    const EXPECTED_TRANSFER_ID = '0xd646c09824e6ae85de32ce292489cf7a1e5f7ff6';

    await deleteTransfer(EXPECTED_TRANSFER_ID);
    await deleteTransaction(txHash);

    const log = await getUserOpEventLog(txHash);

    await handleUserOpEvent({
      chainId: baseSepolia.id,
      log,
    });

    /**
     * 1 Check trace
     */

    const traces = await getTraces(EXPECTED_TRANSFER_ID);

    expect(traces.length).toEqual(1);

    const trace = traces[0];

    expect(trace.transferId).toEqual(EXPECTED_TRANSFER_ID);
    expect(trace.from).toEqual(EXPECTED_FROM_ADDRESS);
    expect(trace.to).toEqual(EXPECTED_TO_ADDRESS);
    expect(trace.amount).toEqual(parseUnits('0.0001', 18));
    expect(trace.transactionHash).toEqual(txHash);
    expect(trace.tokenId).toEqual('eth');
    expect(trace.Transaction.block.chainId).toEqual(baseSepolia.id);
    expect(trace.Transaction.block.number).toEqual(BigInt(15440774));

    /**
     * 2 Check transfer
     */

    const transfer = await prisma.transfer.findUnique({
      where: {
        transferId: EXPECTED_TRANSFER_ID,
      },
    });

    expect(transfer).not.toBeNull();
    expect(transfer?.fromAddress).toEqual(EXPECTED_FROM_ADDRESS);
    expect(transfer?.toAddress).toEqual(EXPECTED_TO_ADDRESS);
  });

  it('should sync erc20 transfer from userOps', async () => {
    // Transaction hash of a erc20 transfer
    const txHash =
      '0xbbf46bfe175aca3e53cde0fe6daac7ce8a7a28707004fc8d4cd0ff775e245db7';

    const EXPECTED_FROM_ADDRESS = '0xd2338AB15A450397Fa69f30AD8F6f8b342Cc261C';
    const EXPECTED_TO_ADDRESS = '0xe6FAb736e2d9343EdE352e6B3C25aB4832E72c30';
    const EXPECTED_AMOUNT = 1000000;

    const EXPECTED_TRANSFER_ID = '0x7cac625cddb738513e84a1883708ca8ccb5cb782';

    await deleteTransfer(EXPECTED_TRANSFER_ID);
    await deleteTransaction(txHash);

    const log = await getUserOpEventLog(txHash);

    await handleUserOpEvent({
      chainId: baseSepolia.id,
      log,
    });

    /**
     * 1 Check trace
     */

    const traces = await getTraces(EXPECTED_TRANSFER_ID);

    expect(traces.length).toEqual(1);

    const trace = traces[0];

    expect(trace.transferId).toEqual(EXPECTED_TRANSFER_ID);
    expect(trace.from).toEqual(EXPECTED_FROM_ADDRESS);
    expect(trace.to).toEqual(EXPECTED_TO_ADDRESS);
    expect(trace.amount).toEqual(BigInt(EXPECTED_AMOUNT));
    expect(trace.transactionHash).toEqual(txHash);
    expect(trace.tokenId).toEqual('usdc');
    expect(trace.Transaction.block.chainId).toEqual(baseSepolia.id);
    expect(trace.Transaction.block.number).toEqual(BigInt(16089628));

    /**
     * 2 Check transfer
     */

    const transfer = await prisma.transfer.findUnique({
      where: {
        transferId: EXPECTED_TRANSFER_ID,
      },
    });

    expect(transfer).not.toBeNull();
    expect(transfer?.fromAddress).toEqual(EXPECTED_FROM_ADDRESS);
    expect(transfer?.toAddress).toEqual(EXPECTED_TO_ADDRESS);
  });
});
