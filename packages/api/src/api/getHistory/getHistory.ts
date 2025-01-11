import {
  formatTokenAmount,
  GetHistoryRequestBody,
  GetHistoryReturnType,
  supportedChains,
  SwapHistoryItem,
  Token,
  HistoryItemType,
  BridgeTransferHistoryItem,
} from '@raylac/shared';
import { getAddress, Hex, parseUnits, zeroAddress } from 'viem';
import { getAlchemyClient } from '../../lib/alchemy';
import { AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';
import { logger } from '@raylac/shared-backend';
import { getToken } from '../../lib/token';
import getBaseTokenPrice from '../getBaseTokenPrice/getBaseTokenPrice';
import { relayGetRequest } from '../../lib/relay';

const getTokenPriceOrThrow = async (token: Token): Promise<number> => {
  const tokenUsdPrice = await getBaseTokenPrice({ token });

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
}): Promise<BridgeTransferHistoryItem | SwapHistoryItem | null> => {
  const relayRequest = await relayGetRequest({ txHash });

  if (!relayRequest) {
    return null;
  }

  if (relayRequest.data.inTxs.length === 0) {
    throw new Error(
      `Relay request ${relayRequest.id} has 0 input transactions`
    );
  }

  if (relayRequest.data.outTxs.length === 0) {
    throw new Error(
      `Relay request ${relayRequest.id} has 0 output transactions`
    );
  }

  const inTx = relayRequest.data.inTxs[0];
  const outTx = relayRequest.data.outTxs[0];

  const sender = relayRequest.data.metadata?.sender;
  const recipient = relayRequest.data.metadata?.recipient;

  if (!sender || !recipient) {
    logger.warn(
      `No sender or recipient found for relay request ${relayRequest.id}`
    );
    return null;
  }

  const currencyIn = relayRequest.data.metadata?.currencyIn;
  const amountIn = relayRequest.data.metadata?.currencyIn?.amount;

  if (!currencyIn || !amountIn) {
    logger.warn(`No currency in found for relay request ${relayRequest.id}`);
    return null;
  }

  const currencyOut = relayRequest.data.metadata?.currencyOut;
  const amountOut = relayRequest.data.metadata?.currencyOut?.amount;

  if (!currencyOut || !amountOut) {
    logger.warn(`No currency out found for relay request ${relayRequest.id}`);
    return null;
  }

  const fromChainId = inTx.chainId;
  const toChainId = outTx.chainId;

  const tokenIn = await getTokenOrThrow({
    tokenAddress: getAddress(currencyIn.currency.address),
    chainId: fromChainId,
  });

  const tokenInUsdPrice = await getTokenPriceOrThrow(tokenIn);

  const tokenOut = await getTokenOrThrow({
    tokenAddress: getAddress(currencyOut.currency.address),
    chainId: toChainId,
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

  if (tokenIn.id === tokenOut.id) {
    // Map as a transfer
    const direction = sender === address ? 'outgoing' : 'incoming';

    const transferItem: BridgeTransferHistoryItem = {
      relayId: relayRequest.id,
      from: sender,
      to: recipient,
      amount: amountInFormatted,
      token: tokenIn,
      fromChainId: fromChainId,
      toChainId: toChainId,
      timestamp: relayRequest.createdAt,
      type: HistoryItemType.BRIDGE_TRANSFER,
      direction,
      inTxHash: inTx.hash,
      outTxHash: outTx.hash,
    };

    return transferItem;
  }

  if (fromChainId === toChainId) {
    // Map as single-chian swap
    const swapHistoryItem: SwapHistoryItem = {
      relayId: relayRequest.id,
      type: HistoryItemType.SWAP,
      address: getAddress(sender),
      amountIn: amountInFormatted,
      amountOut: amountOutFormatted,
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      fromChainId: fromChainId,
      toChainId: toChainId,
      timestamp: relayRequest.createdAt,
      inTxHash: inTx.hash,
      outTxHash: inTx.hash,
    };

    return swapHistoryItem;
  }

  // Map as cross-chain swap

  const swapHistoryItem: SwapHistoryItem = {
    relayId: relayRequest.id,
    type: HistoryItemType.SWAP,
    address: getAddress(sender),
    amountIn: amountInFormatted,
    amountOut: amountOutFormatted,
    tokenIn: tokenIn,
    tokenOut: tokenOut,
    fromChainId: fromChainId,
    toChainId: toChainId,
    timestamp: relayRequest.createdAt,
    inTxHash: inTx.hash,
    outTxHash: outTx.hash,
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
      const [incoming, outgoing] = await Promise.all([
        alchemy.core.getAssetTransfers({
          toAddress: address,
          category: [
            AssetTransfersCategory.ERC20,
            AssetTransfersCategory.EXTERNAL,
          ],
          withMetadata: true,
          order: SortingOrder.DESCENDING,
          maxCount: 10,
        }),
        // Get outgoing transfers
        alchemy.core.getAssetTransfers({
          fromAddress: address,
          category: [
            AssetTransfersCategory.ERC20,
            AssetTransfersCategory.EXTERNAL,
          ],
          order: SortingOrder.DESCENDING,
          maxCount: 10,
          withMetadata: true,
        }),
      ]);

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

              const usdPrice = await getBaseTokenPrice({
                token,
              });

              if (usdPrice === null) {
                return null;
              }

              const fromAddress = getAddress(transfer.from as Hex);
              const toAddress = getAddress(transfer.to! as Hex);

              const relayTx = await mapAsRelayTx({
                txHash: transfer.hash as Hex,
                address,
              });

              if (relayTx) {
                return relayTx;
              }

              const direction = addresses.includes(fromAddress)
                ? 'outgoing'
                : 'incoming';

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
                type: HistoryItemType.TRANSFER,
                direction,
                txHash: transfer.hash as Hex,
              };

              return transferItem;
            })
        )
      )
        .filter(item => item !== null)
        // Filter out duplicate Relay txs
        .filter((item, index, self) => {
          if (item.type === HistoryItemType.TRANSFER) {
            return true;
          }

          return (
            self.findIndex(
              sw =>
                (sw as BridgeTransferHistoryItem | SwapHistoryItem).relayId ===
                item.relayId
            ) === index
          );
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
  )
    .flat()
    // Filter out duplicate Relay txs
    .filter((item, index, self) => {
      if (
        item.type !== HistoryItemType.BRIDGE_TRANSFER &&
        item.type !== HistoryItemType.SWAP
      ) {
        return true;
      }

      return (
        (self as (SwapHistoryItem | BridgeTransferHistoryItem)[]).findIndex(
          sw => sw.relayId === item.relayId
        ) === index
      );
    });

  const allTransfers = [...transfers];

  // Sort by timestamp in descending order
  allTransfers.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return allTransfers;
};

export default getHistory;
