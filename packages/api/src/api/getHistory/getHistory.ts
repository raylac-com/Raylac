import {
  formatBalance,
  GetHistoryRequestBody,
  GetHistoryReturnType,
  HistoryItemType,
  supportedChains,
} from '@raylac/shared';
import { getAddress, Hex, parseUnits, zeroAddress } from 'viem';
import { getAlchemyClient } from '../../lib/alchemy';
import { AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';
import { logger } from '@raylac/shared-backend';
import { getToken } from '../../lib/token';
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';
import { deletePendingTx, getPendingTxsFromRedis } from '../../lib/transaction';

const getHistoryOnChain = async ({
  addresses,
  chainId,
}: {
  addresses: Hex[];
  chainId: number;
}): Promise<GetHistoryReturnType> => {
  const alchemy = await getAlchemyClient(chainId);

  const transfers = await Promise.all(
    addresses.map(async address => {
      // Get incoming transfers
      const incoming = await alchemy.core.getAssetTransfers({
        toAddress: address,
        category: [
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.EXTERNAL,
        ],
        withMetadata: true,
        order: SortingOrder.DESCENDING,
        maxCount: 10,
      });

      // Get outgoing transfers
      const outgoing = await alchemy.core.getAssetTransfers({
        fromAddress: address,
        category: [
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.EXTERNAL,
        ],
        order: SortingOrder.DESCENDING,
        maxCount: 10,
        withMetadata: true,
      });

      const transfers: GetHistoryReturnType = (
        await Promise.all(
          [...incoming.transfers, ...outgoing.transfers].map(async transfer => {
            const token = await getToken({
              tokenAddress: (transfer.rawContract.address ||
                zeroAddress) as Hex,
              chainId,
            });

            if (!token) {
              logger.warn(
                `No token found for ${transfer.rawContract.address} on chain ${chainId}`
              );
              return null;
            }

            const usdPrice = await getTokenUsdPrice({
              token,
            });

            if (usdPrice === 'notfound') {
              return null;
            }

            const fromAddress = getAddress(transfer.from as Hex);
            const toAddress = getAddress(transfer.to! as Hex);

            let type;

            if (
              addresses.includes(fromAddress) &&
              addresses.includes(toAddress)
            ) {
              type = HistoryItemType.MOVE_FUNDS;
            } else if (addresses.includes(fromAddress)) {
              type = HistoryItemType.OUTGOING;
            } else {
              type = HistoryItemType.INCOMING;
            }

            const formattedAmount = formatBalance({
              balance: parseUnits(
                transfer.value?.toString() || '0',
                token.decimals
              ),
              token,
              tokenPriceUsd: usdPrice,
            });

            const transferItem: GetHistoryReturnType[number] = {
              from: fromAddress,
              to: toAddress,
              amount: formattedAmount,
              token,
              chainId: chainId,
              timestamp: transfer.metadata.blockTimestamp,
              type,
              txHash: transfer.hash as Hex,
            };

            return transferItem;
          })
        )
      ).filter(item => item !== null);

      return transfers;
    })
  );

  return transfers.flat();
};

const getHistory = async ({
  addresses,
}: GetHistoryRequestBody): Promise<GetHistoryReturnType> => {
  const transfers = (
    await Promise.all(
      supportedChains.map(chainId =>
        getHistoryOnChain({ addresses, chainId: chainId.id })
      )
    )
  ).flat();

  const confirmedTxHashes = transfers.map(tx => tx.txHash);

  // Get pending transactions
  const pendingTxs = await Promise.all(
    addresses.map(async address => {
      const pendingTxsInRedis = await getPendingTxsFromRedis(address);

      // Array to store pending transactions filtered from redis
      const pendingTxs = [];

      // Array to store confirmed transactions filtered from redis
      const confirmedTxs = [];

      for (const tx of pendingTxsInRedis) {
        // Check if the transaction is confirmed
        const isConfirmed = confirmedTxHashes.includes(tx.txHash);

        if (!isConfirmed) {
          pendingTxs.push(tx);
        } else {
          confirmedTxs.push(tx);
        }
      }

      // Delete confirmed transactions from redis
      await deletePendingTx(confirmedTxs);

      return pendingTxs;
    })
  );

  const pending = pendingTxs.flat();

  const pendingTransfers = pending.map(tx => ({
    from: tx.from,
    to: tx.to,
    amount: tx.amount,
    token: tx.token,
    chainId: tx.chainId,
    timestamp: new Date().toISOString(),
    type: HistoryItemType.PENDING,
    txHash: tx.txHash,
  }));

  const allTransfers = [...transfers, ...pendingTransfers];

  // Sort by timestamp in descending order
  allTransfers.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return allTransfers;
};

export default getHistory;
