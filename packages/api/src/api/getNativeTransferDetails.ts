import prisma from '@/lib/prisma';
import { Hex } from 'viem';
import {
  TransferTraceQueryResult,
  NativeTransferDetailsReturnType,
} from '@raylac/shared';

const getNativeTransferDetails = async ({
  txHash,
  traceAddress,
}: {
  txHash: Hex;
  traceAddress: string;
}): Promise<NativeTransferDetailsReturnType> => {
  const result = await prisma.$queryRaw<TransferTraceQueryResult[]>`
    SELECT
        amount,
        "from",
        "to",
        "tokenId",
        "chainId",
        "blockNumber",
        "txHash",
        "traceAddress"
    FROM
        "TransferTrace"
    WHERE
        "txHash" = ${txHash} AND "traceAddress" = ${traceAddress}
  `;

  const tokenId = result[0].tokenId;
  const amount = result[0].amount;

  const chainId = result[0].chainId;
  const blockNumber = result[0].blockNumber;

  return {
    from: result[0].from,
    to: result[0].to,
    tokenId,
    amount,
    txHash,
    chainId,
    blockNumber
  };
};

export default getNativeTransferDetails;
