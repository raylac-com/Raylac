import {
  GetHistoryRequestBody,
  GetHistoryReturnType,
  HistoryItemType,
  supportedChains,
} from '@raylac/shared';
import { getAddress, Hex, zeroAddress } from 'viem';
import { getAlchemyClient } from '../../lib/alchemy';
import { AssetTransfersCategory } from 'alchemy-sdk';
import { getTokenMetadata } from '../../utils';
import getTokenPrice from '../getTokenPrice/getTokenPrice';
import BigNumber from 'bignumber.js';

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
      const incoming = await alchemy.core.getAssetTransfers({
        toAddress: address,
        category: [
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.EXTERNAL,
        ],
        withMetadata: true,
        maxCount: 10,
      });

      const outgoing = await alchemy.core.getAssetTransfers({
        fromAddress: address,
        category: [
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.EXTERNAL,
        ],
        withMetadata: true,
        maxCount: 10,
      });

      const transfers: GetHistoryReturnType = (
        await Promise.all(
          [...incoming.transfers, ...outgoing.transfers].map(async transfer => {
            const token = await getTokenMetadata({
              tokenAddress: (transfer.rawContract.address ||
                zeroAddress) as Hex,
              chainId,
            });

            if (!token) {
              return null;
            }

            const price = await getTokenPrice({
              tokenAddress: token.addresses[0].address,
              chainId: token.addresses[0].chainId,
            });

            const usdPrice =
              price.prices.find(p => p.currency === 'usd')?.value || '0';

            const amountUsd = new BigNumber(transfer.value || 0)
              .multipliedBy(new BigNumber(usdPrice))
              .toFixed(2);

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

            const transferItem: GetHistoryReturnType[number] = {
              from: fromAddress,
              to: toAddress,
              amount: transfer.value?.toString() || '0',
              token,
              amountUsd,
              chainId: chainId,
              timestamp: transfer.metadata.blockTimestamp,
              type,
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

  // Sort by timestamp in descending order
  transfers.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return transfers;
};

export default getHistory;
