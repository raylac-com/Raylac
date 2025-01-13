import {
  formatTokenAmount,
  GetHistoryRequestBody,
  GetHistoryReturnType,
  supportedChains,
  SwapHistoryItem,
  Token,
  HistoryItemType,
  BridgeTransferHistoryItem,
  CrossChainSwapHistoryItem,
  BridgeHistoryItem,
  MultiCurrencyValue,
} from '@raylac/shared';
import { getAddress, Hex, parseUnits, zeroAddress } from 'viem';
import { getAlchemyClient } from '../../lib/alchemy';
import { AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';
import { logger } from '@raylac/shared-backend';
import { getToken } from '../../lib/token';
import getTokenPrice from '../getTokenPrice/getTokenPrice';
import { relayGetRequest } from '../../lib/relay';

const getTokenPriceOrThrow = async (
  token: Token
): Promise<MultiCurrencyValue> => {
  const tokenPrice = await getTokenPrice({ token });

  if (!tokenPrice) {
    throw new Error(`No token price found for ${token.symbol} `);
  }

  return tokenPrice;
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
}): Promise<
  | BridgeTransferHistoryItem
  | BridgeHistoryItem
  | SwapHistoryItem
  | CrossChainSwapHistoryItem
  | null
> => {
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

  const tokenInPrice = await getTokenPriceOrThrow(tokenIn);

  const tokenOut = await getTokenOrThrow({
    tokenAddress: getAddress(currencyOut.currency.address),
    chainId: toChainId,
  });

  const tokenOutPrice = await getTokenPriceOrThrow(tokenOut);

  const amountInFormatted = formatTokenAmount({
    amount: BigInt(amountIn),
    token: tokenIn,
    tokenPrice: tokenInPrice,
  });

  const amountOutFormatted = formatTokenAmount({
    amount: BigInt(amountOut),
    token: tokenOut,
    tokenPrice: tokenOutPrice,
  });

  if (tokenIn.id === tokenOut.id) {
    if (sender === recipient && fromChainId !== toChainId) {
      // Map as a brdige

      const bridgeItem: BridgeHistoryItem = {
        relayId: relayRequest.id,
        address: sender,
        amountIn: amountInFormatted,
        amountOut: amountOutFormatted,
        token: tokenIn,
        fromChainId: fromChainId,
        toChainId: toChainId,
        timestamp: relayRequest.createdAt,
        type: HistoryItemType.BRIDGE,
        inTxHash: inTx.hash,
        outTxHash: outTx.hash,
      };

      return bridgeItem;
    } else {
      // Map as transfer
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
      chainId: fromChainId,
      timestamp: relayRequest.createdAt,
      txHash: inTx.hash,
    };

    return swapHistoryItem;
  } else {
    // Map as cross-chain swap
    const swapHistoryItem: CrossChainSwapHistoryItem = {
      relayId: relayRequest.id,
      type: HistoryItemType.CROSS_CHAIN_SWAP,
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
  }
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

              const tokenPrice = await getTokenPrice({
                token,
              });

              if (tokenPrice === null) {
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
                tokenPrice: tokenPrice,
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
      ).filter(item => item !== null);

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
      if (item.type === HistoryItemType.TRANSFER) {
        return true;
      }

      return (
        self.findIndex(
          sw =>
            (
              sw as
                | BridgeTransferHistoryItem
                | SwapHistoryItem
                | BridgeHistoryItem
                | CrossChainSwapHistoryItem
            ).relayId === item.relayId
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
