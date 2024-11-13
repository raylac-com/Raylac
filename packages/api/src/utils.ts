import { getTokenMetadata } from '@raylac/shared';
import { formatAmount } from '@raylac/shared';
import { TransferQueryResult } from './queries/selectTransfer';
import { logger } from '@raylac/shared-backend';

export const JWT_PRIV_KEY = process.env.JWT_PRIV_KEY as string;

if (!JWT_PRIV_KEY) {
  throw new Error('JWT_PRIV_KEY is required');
}

/**
 * Sort tx traces by trace address in descending order
 */
const sortTxTracesByTraceAddress = (
  tx: TransferQueryResult['transactions'][number]
) => {
  return tx.traces.sort((a, b) => {
    if (!a.traceAddress || !b.traceAddress) {
      throw new Error(`Trace address is null for transaction ${tx.hash}`);
    }

    const aTraceAddress = a.traceAddress.split('_');
    const bTraceAddress = b.traceAddress.split('_');

    if (aTraceAddress.length !== bTraceAddress.length) {
      throw new Error(
        `Trace address length mismatch for transaction ${tx.hash}`
      );
    }

    const aTraceIndex = parseInt(aTraceAddress[aTraceAddress.length - 1]);
    const bTraceIndex = parseInt(bTraceAddress[bTraceAddress.length - 1]);

    logger.info(`${aTraceIndex} - ${bTraceIndex}`);

    return bTraceIndex - aTraceIndex;
  });
};

/**
 * Sort tx traces by log index in descending order
 */
const sortTxByLogIndex = (tx: TransferQueryResult['transactions'][number]) => {
  return tx.traces.sort((a, b) => {
    if (!a.logIndex || !b.logIndex) {
      throw new Error(`Log index is null for transaction ${tx.hash}`);
    }

    return b.logIndex - a.logIndex;
  });
};

/**
 * Get the amount of a transfer by summing up the amounts of the traces
 */
const getTransferAmount = (
  transfer: TransferQueryResult
): { amount: bigint; usdAmount: string | null } => {
  let amount = 0n;

  const tokenId = transfer.transactions[0].traces[0].tokenId;
  const isNativeTransfer = tokenId === 'eth';

  for (const transaction of transfer.transactions) {
    const sortedTraces = isNativeTransfer
      ? sortTxTracesByTraceAddress(transaction)
      : sortTxByLogIndex(transaction);

    const lastTrace = sortedTraces[0];

    amount += BigInt(lastTrace.amount.toString());
  }

  const tokenPriceAtTrace =
    transfer.transactions[0].traces[0].tokenPriceAtTrace;

  const tokenMeta = getTokenMetadata(tokenId);

  if (!tokenMeta) {
    throw new Error(`Token metadata not found for token ${tokenId}`);
  }

  const formattedAmount = Number(
    formatAmount(amount.toString(), tokenMeta.decimals)
  );

  const usdAmount =
    tokenPriceAtTrace !== null
      ? (tokenPriceAtTrace * Number(formattedAmount)).toFixed(2)
      : null;

  return { amount, usdAmount };
};

export const parseTransferData = ({
  transfer,
  userId,
}: {
  transfer: TransferQueryResult;
  userId: number;
}) => {
  const isNativeTransfer = transfer.transactions[0].traces[0].tokenId === 'eth';

  const { amount, usdAmount } = getTransferAmount(transfer);

  // We can determine the sender and recipient by looking at the last trace in one of the transactions
  const sortedTraces = isNativeTransfer
    ? sortTxTracesByTraceAddress(transfer.transactions[0])
    : sortTxByLogIndex(transfer.transactions[0]);

  const lastTrace = sortedTraces[0];

  const fromUser = lastTrace.UserStealthAddressFrom?.user;
  const toUser = lastTrace.UserStealthAddressTo?.user;

  const fromAddress = lastTrace.from;
  const toAddress = lastTrace.to;

  const transferType =
    lastTrace.UserStealthAddressFrom?.userId === userId
      ? 'outgoing'
      : 'incoming';

  return {
    ...transfer,
    amount: amount.toString(),
    usdAmount,
    fromUser,
    toUser,
    fromAddress,
    toAddress,
    transferType,
  };
};
