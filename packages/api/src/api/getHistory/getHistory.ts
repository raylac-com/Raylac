import {
  GetHistoryRequestBody,
  GetHistoryReturnType,
  SwapHistoryItem,
  TransferHistoryItem,
} from '@raylac/shared';
import prisma from '../../lib/prisma';
import getToken from '../getToken/getToken';
import { formatUnits, Hex } from 'viem';

const getHistory = async ({
  address,
}: GetHistoryRequestBody): Promise<GetHistoryReturnType> => {
  const result = await prisma.history.findMany({
    include: {
      Transfer: {
        select: {
          txHash: true,
          from: true,
          to: true,
          amount: true,
          tokenAddress: true,
          amountUsd: true,
          destinationChainId: true,
          bridges: {
            select: {
              txHash: true,
              fromChainId: true,
              toChainId: true,
              amountIn: true,
              amountOut: true,
              bridgeFeeAmount: true,
              bridgeFeeUsd: true,
            },
          },
        },
      },
      Swap: {
        select: {
          lineItems: {
            select: {
              fromChainId: true,
              toChainId: true,
              txHash: true,
            },
          },
          address: true,
          amountIn: true,
          amountOut: true,
          amountInUsd: true,
          amountOutUsd: true,
          tokenAddressIn: true,
          tokenAddressOut: true,
        },
      },
    },
    where: {
      OR: [
        {
          Transfer: {
            OR: [{ from: address }, { to: address }],
          },
        },
        {
          Swap: {
            address,
          },
        },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const history = await Promise.all(
    result
      .map(item => item.Transfer || item.Swap)
      .filter(item => item !== null)
      .map(async item => {
        if ('tokenAddress' in item) {
          // Return `item` as `TransferHistoryItem`

          const token = await getToken({
            tokenAddress: item.tokenAddress as Hex,
          });

          const amount = item.amount.toString();
          const amountUsd = item.amountUsd.toString();

          const transferHistoryItem: TransferHistoryItem = {
            token,
            txHash: item.txHash as Hex,
            from: item.from as Hex,
            to: item.to as Hex,
            destinationChainId: item.destinationChainId,
            amount,
            amountUsd,
            bridges: item.bridges.map(bridge => ({
              txHash: bridge.txHash as Hex,
              fromChainId: bridge.fromChainId,
              toChainId: bridge.toChainId,
              amountIn: bridge.amountIn.toString(),
              amountOut: bridge.amountOut.toString(),
              bridgeFeeAmount: bridge.bridgeFeeAmount.toString(),
              bridgeFeeUsd: bridge.bridgeFeeUsd.toString(),
            })),
          };

          return transferHistoryItem;
        } else {
          // Return `item` as `SwapHistoryItem`

          const tokenIn = await getToken({
            tokenAddress: item.tokenAddressIn as Hex,
          });

          const tokenOut = await getToken({
            tokenAddress: item.tokenAddressOut as Hex,
          });

          const amountIn = item.amountIn.toString();
          const amountOut = item.amountOut.toString();

          const amountInFormatted = formatUnits(
            BigInt(amountIn),
            tokenIn.decimals
          );

          const amountOutFormatted = formatUnits(
            BigInt(amountOut),
            tokenOut.decimals
          );

          const amountInUsd = item.amountInUsd.toString();
          const amountOutUsd = item.amountOutUsd.toString();

          const swapHistoryItem: SwapHistoryItem = {
            lineItems: item.lineItems.map(lineItem => ({
              txHash: lineItem.txHash as Hex,
              fromChainId: lineItem.fromChainId,
              toChainId: lineItem.toChainId,
            })),
            address: item.address as Hex,
            amountIn,
            amountOut,
            amountInUsd,
            amountOutUsd,
            tokenIn,
            tokenOut,
            amountInFormatted,
            amountOutFormatted,
          };

          return swapHistoryItem;
        }
      })
  );

  return history as GetHistoryReturnType;
};

export default getHistory;