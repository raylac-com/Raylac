import prisma from '@/lib/prisma';
import { Hex } from 'viem';
import {
  TransferWithExecutionTagQueryResult,
  RaylacTransferDetailsReturnType,
} from '@raylac/shared';

const getRaylacTransferDetails = async ({
  executionTag,
}: {
  executionTag?: Hex;
}): Promise<RaylacTransferDetailsReturnType> => {
  const result = await prisma.$queryRaw<TransferWithExecutionTagQueryResult[]>`
      SELECT
          amount,
          "executionType",
          "from",
          "to",
          "tokenId",
          "txHash",
          u1. "userId" AS "fromUserId",
          u2. "userId" AS "toUserId",
          "blockNumber",
          "executionTag",
          "traceAddress",
          "chainId"
        FROM
          "TransferTrace" t
          LEFT JOIN "UserStealthAddress" u1 ON u1.address = t. "from"
          LEFT JOIN "UserStealthAddress" u2 ON u2.address = t. "to"
        WHERE
          "executionTag" = ${executionTag}
      `;

  // Sanity check the result

  const finalTransfer = result.find(row => row.toUserId !== row.fromUserId);

  if (!finalTransfer) {
    throw new Error('Could not find the final transfer');
  }

  const fromUserId = finalTransfer.fromUserId;
  const toUserId = finalTransfer.toUserId;

  const tokenId = result[0].tokenId;
  const amount = finalTransfer.amount;

  const traces = result.map(row => ({
    success: row.success,
    txHash: row.txHash,
    chainId: row.chainId,
    from: row.from,
    to: row.to,
    amount: row.amount,
    blockNumber: row.blockNumber,
  }));

  return {
    fromUserId,
    toUserId,
    toAddress: finalTransfer.to,
    tokenId,
    amount: amount.toString(),
    traces,
  };
};

export default getRaylacTransferDetails;
