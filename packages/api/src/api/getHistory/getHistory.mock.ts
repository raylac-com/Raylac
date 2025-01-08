import {
  GetHistoryRequestBody,
  GetHistoryReturnType,
  HistoryItemType,
  MOCK_TOKEN_AMOUNT,
  ETH,
  USDC,
} from '@raylac/shared';
import { Hex } from 'viem';
import { arbitrum, base, optimism } from 'viem/chains';

const getHistoryMock = async (
  _arg: GetHistoryRequestBody
): Promise<GetHistoryReturnType> => {
  return [
    // Transfer history item
    {
      type: HistoryItemType.TRANSFER,
      direction: 'outgoing',
      txHash:
        '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789' as Hex,
      from: '0x1111111111111111111111111111111111111111' as Hex,
      to: '0x2222222222222222222222222222222222222222' as Hex,
      fromChainId: base.id,
      toChainId: base.id,
      amount: MOCK_TOKEN_AMOUNT,
      token: ETH,
      timestamp: new Date().toISOString(),
    },
    // Bridge transfer history item
    {
      type: HistoryItemType.BRIDGE_TRANSFER,
      relayId: 'bridge-tx-001',
      direction: 'outgoing',
      from: '0x1111111111111111111111111111111111111111' as Hex,
      to: '0x3333333333333333333333333333333333333333' as Hex,
      fromChainId: base.id,
      toChainId: optimism.id,
      amount: MOCK_TOKEN_AMOUNT,
      token: ETH,
      timestamp: new Date().toISOString(),
      inTxHash:
        '0xdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd' as Hex,
      outTxHash:
        '0x789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456' as Hex,
    },
    // Swap history item
    {
      type: HistoryItemType.SWAP,
      relayId: 'swap-tx-001',
      address: '0x1111111111111111111111111111111111111111' as Hex,
      amountIn: MOCK_TOKEN_AMOUNT,
      amountOut: {
        ...MOCK_TOKEN_AMOUNT,
        amount: '990000000000000000', // 0.99 tokens (accounting for slippage)
        formatted: '0.99',
      },
      tokenIn: ETH,
      tokenOut: USDC,
      fromChainId: arbitrum.id,
      toChainId: optimism.id,
      timestamp: new Date().toISOString(),
      inTxHash:
        '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0' as Hex,
      outTxHash:
        '0x56789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234' as Hex,
    },
  ];
};

export default getHistoryMock;
