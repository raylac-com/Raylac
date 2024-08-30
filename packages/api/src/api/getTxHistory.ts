import alchemy from '@/lib/alchemy';
import prisma from '@/lib/prisma';
import {
  Transfer,
  TransferStatus,
  USDC_CONTRACT_ADDRESS,
} from '@sutori/shared';
import { AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';
import { Hex } from 'viem';

/**
 * Get the transaction history of all stealth addresses for a user
 */
const getTxHistory = async ({ userId }: { userId: number }) => {
  const addresses = await prisma.userStealthAddress.findMany({
    select: {
      address: true,
    },
    where: {
      userId,
    },
  });

  const incomingTxs = await Promise.all(
    addresses.map(async address => {
      return alchemy.core.getAssetTransfers({
        category: [AssetTransfersCategory.ERC20],
        toAddress: address.address as Hex,
        contractAddresses: [USDC_CONTRACT_ADDRESS],
        order: SortingOrder.DESCENDING,
        withMetadata: true,
        toBlock: 'latest',
      });
    })
  );

  const outgoingTransfers = await prisma.transfer.findMany({
    select: {
      amount: true,
      toAddress: true,
      toUser: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      userOpReceipts: {
        select: {
          success: true,
        },
      },
      createdAt: true,
    },
    where: {
      fromUserId: userId,
    },
  });

  const transfers: Transfer[] = [
    ...outgoingTransfers.map(transfer => ({
      type: 'outgoing',
      to: transfer.toUser || (transfer.toAddress as Hex),
      amount: Number(transfer.amount / BigInt(10 ** 6)),
      timestamp: transfer.createdAt.getTime(),
      status: transfer.userOpReceipts.every(receipt => receipt.success)
        ? TransferStatus.Success
        : TransferStatus.Pending,
    })),
    ...incomingTxs.flatMap(txs =>
      txs.transfers.map(tx => ({
        type: 'incoming',
        from: tx.from as Hex,
        amount: tx.value as number,
        timestamp: new Date(tx.metadata.blockTimestamp).getTime(),
        status: TransferStatus.Success,
      }))
    ),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return transfers;
};

export default getTxHistory;
