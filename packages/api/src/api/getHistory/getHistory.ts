import {
  formatTokenAmount,
  GetHistoryRequestBody,
  GetHistoryReturnType,
  RELAY_RECEIVER_ADDRESSES,
  supportedChains,
  SwapHistoryItem,
  TransferHistoryItem,
  Token,
  HistoryItemType,
  RELAY_ERC20_ROUTER_ADDRESSES,
  HistoryItem,
} from '@raylac/shared';
import { getAddress, Hex, parseUnits, zeroAddress } from 'viem';
import { getAlchemyClient } from '../../lib/alchemy';
import { AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';
import { logger } from '@raylac/shared-backend';
import { getToken } from '../../lib/token';
import getTokenUsdPrice from '../getTokenUsdPrice/getTokenUsdPrice';
import { relayGetRequest } from '../../lib/relay';

const getTokenPriceOrThrow = async (token: Token): Promise<number> => {
  const tokenUsdPrice = await getTokenUsdPrice({ token });

  if (!tokenUsdPrice) {
    throw new Error(`No token price found for ${token.symbol} `);
  }

  return tokenUsdPrice;
};

const getTokenOrThrow = async ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: number;
}): Promise<Token> => {
  const token = await getToken({ tokenAddress, chainId });

  if (!token) {
    throw new Error(`No token found for ${tokenAddress} on chain ${chainId}`);
  }

  return token;
};

const mapAsRelayTx = async ({
  txHash,
  address,
}: {
  txHash: Hex;
  address: Hex;
}): Promise<HistoryItem> => {
  const relayRequest = await relayGetRequest({ txHash });

  const currencyIn = relayRequest.data.metadata.currencyIn;
  const currencyOut = relayRequest.data.metadata.currencyOut;

  const amountIn = currencyIn.amount;

  const tokenIn = await getTokenOrThrow({
    tokenAddress: currencyIn.currency.address,
    chainId: currencyIn.currency.chainId,
  });

  const tokenInUsdPrice = await getTokenPriceOrThrow(tokenIn);

  const amountOut = currencyOut.amount;

  const tokenOut = await getTokenOrThrow({
    tokenAddress: currencyOut.currency.address,
    chainId: currencyOut.currency.chainId,
  });

  const tokenOutUsdPrice = await getTokenPriceOrThrow(tokenOut);

  const amountInFormatted = formatTokenAmount({
    amount: BigInt(amountIn),
    token: tokenIn,
    tokenPriceUsd: tokenInUsdPrice,
  });

  const amountOutFormatted = formatTokenAmount({
    amount: BigInt(amountOut),
    token: tokenOut,
    tokenPriceUsd: tokenOutUsdPrice,
  });

  const sender = getAddress(relayRequest.data.metadata.sender);
  const recipient = getAddress(relayRequest.data.metadata.recipient);

  if (currencyIn.currency.address === currencyOut.currency.address) {
    const transferItem: TransferHistoryItem = {
      relayId: relayRequest.id,
      from: sender,
      to: recipient,
      amount: amountInFormatted,
      token: tokenIn,
      fromChainId: currencyIn.currency.chainId,
      toChainId: currencyOut.currency.chainId,
      timestamp: relayRequest.createdAt,
      type:
        address === sender
          ? HistoryItemType.OUTGOING
          : HistoryItemType.INCOMING,
      txHash: txHash,
    };

    return transferItem;
  }

  const swapHistoryItem: SwapHistoryItem = {
    relayId: relayRequest.id,
    type: HistoryItemType.SWAP,
    address: getAddress(relayRequest.data.metadata.sender),
    amountIn: amountInFormatted,
    amountOut: amountOutFormatted,
    tokenIn: tokenIn,
    tokenOut: tokenOut,
    fromChainId: currencyIn.currency.chainId,
    toChainId: currencyOut.currency.chainId,
    timestamp: relayRequest.createdAt,
  };

  return swapHistoryItem;
};

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

      // Map the Alchemy transfer data to `GetHistoryReturnType`
      const transfers: GetHistoryReturnType = (
        await Promise.all(
          [...incoming.transfers, ...outgoing.transfers]
            // Filter out duplicate tx hashes
            .filter(
              (transfer, index, self) =>
                self.findIndex(t => t.hash === transfer.hash) === index
            )
            .map(async transfer => {
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

              if (usdPrice === null) {
                return null;
              }

              const fromAddress = getAddress(transfer.from as Hex);
              const toAddress = getAddress(transfer.to! as Hex);

              if (
                RELAY_RECEIVER_ADDRESSES.includes(toAddress) ||
                RELAY_RECEIVER_ADDRESSES.includes(fromAddress) ||
                RELAY_ERC20_ROUTER_ADDRESSES.includes(toAddress as Hex) ||
                RELAY_ERC20_ROUTER_ADDRESSES.includes(fromAddress as Hex) ||
                fromAddress === '0xf70da97812CB96acDF810712Aa562db8dfA3dbEF'
              ) {
                const relayTx = await mapAsRelayTx({
                  txHash: transfer.hash as Hex,
                  address,
                });
                return relayTx;
              }

              let type;

              if (addresses.includes(fromAddress)) {
                type = HistoryItemType.OUTGOING;
              } else {
                type = HistoryItemType.INCOMING;
              }

              const formattedAmount = formatTokenAmount({
                amount: parseUnits(
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
                fromChainId: chainId,
                toChainId: chainId,
                timestamp: transfer.metadata.blockTimestamp,
                type,
                txHash: transfer.hash as Hex,
              };

              return transferItem;
            })
        )
      )
        .filter(item => item !== null)
        // Filter out duplicate Relay txs
        .filter((item, index, self) => {
          if (item.relayId === undefined) {
            return true;
          }

          return self.findIndex(sw => sw.relayId === item.relayId) === index;
        });

      return transfers;
    })
  );

  // Filter out same tx hashes
  const uniqueTransfers = transfers.flat();

  return uniqueTransfers;
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

  /*
  const confirmedTxHashes = transfers.map(tx => tx.tx);

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
  */

  const allTransfers = [...transfers];

  // Sort by timestamp in descending order
  allTransfers.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return allTransfers;
};

export default getHistory;
