import {
  GetHistoryRequestBody,
  GetHistoryReturnType,
  HistoryItemType,
  TokenAmount,
  Token,
} from '@raylac/shared';
import { Hex } from 'viem';

const mockToken: Token = {
  id: '0x1234567890123456789012345678901234567890' as Hex,
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  logoURI: 'https://ethereum.org/eth-logo.svg',
  verified: true,
  addresses: [
    {
      chainId: 1,
      address: '0x1234567890123456789012345678901234567890' as Hex,
    },
  ],
};

const mockTokenAmount: TokenAmount = {
  amount: '1000000000000000000',
  formatted: '1.0',
  usdValue: '2000',
  usdValueFormatted: '2,000',
  tokenPriceUsd: 2000,
};

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
      fromChainId: 1,
      toChainId: 1,
      amount: mockTokenAmount,
      token: mockToken,
      timestamp: new Date().toISOString(),
    },
    // Bridge transfer history item
    {
      type: HistoryItemType.BRIDGE_TRANSFER,
      relayId: 'bridge-tx-001',
      direction: 'outgoing',
      from: '0x1111111111111111111111111111111111111111' as Hex,
      to: '0x3333333333333333333333333333333333333333' as Hex,
      fromChainId: 1,
      toChainId: 137, // Polygon
      amount: mockTokenAmount,
      token: mockToken,
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
      amountIn: mockTokenAmount,
      amountOut: {
        ...mockTokenAmount,
        amount: '990000000000000000', // 0.99 tokens (accounting for slippage)
        formatted: '0.99',
      },
      tokenIn: mockToken,
      tokenOut: {
        ...mockToken,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
      },
      fromChainId: 1,
      toChainId: 1,
      timestamp: new Date().toISOString(),
      inTxHash:
        '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0' as Hex,
      outTxHash:
        '0x56789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234' as Hex,
    },
  ];
};

export default getHistoryMock;
