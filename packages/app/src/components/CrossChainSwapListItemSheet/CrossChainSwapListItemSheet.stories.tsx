import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import CrossChainSwapListItemSheet from './CrossChainSwapListItemSheet';
import { zeroAddress } from 'viem';
import {
  HistoryItemType,
  CrossChainSwapHistoryItem,
  Token,
  TokenAmount,
} from '@raylac/shared';
const mockToken: Token = {
  id: '0x0000000000000000000000000000000000000001',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  logoURI: 'https://example.com/token.png',
  verified: true,
  addresses: [
    { chainId: 1, address: zeroAddress },
    { chainId: 137, address: zeroAddress },
  ],
};

const mockAmount: TokenAmount = {
  amount: '1000000',
  formatted: '1.00',
  usdValue: '1.00',
  usdValueFormatted: '1.00',
  tokenPriceUsd: 1.0,
};

const mockSwap: CrossChainSwapHistoryItem = {
  type: HistoryItemType.CROSS_CHAIN_SWAP,
  relayId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  address: zeroAddress,
  tokenIn: mockToken,
  tokenOut: {
    ...mockToken,
    id: '0x0000000000000000000000000000000000000002',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
  },
  amountIn: mockAmount,
  amountOut: {
    ...mockAmount,
    amount: '500000000000000000',
    formatted: '0.5',
    tokenPriceUsd: 2000.0,
  },
  fromChainId: 1,
  toChainId: 1,
  timestamp: new Date().toISOString(),
  inTxHash:
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  outTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
};

const meta = {
  title: 'CrossChainSwapListItemSheet',
  component: CrossChainSwapListItemSheet,
  args: {
    swap: mockSwap,
    onClose: () => {},
  },
  decorators: [
    Story => (
      <View style={{ padding: 16, flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof CrossChainSwapListItemSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const DifferentTokens: Story = {
  args: {
    swap: {
      ...mockSwap,
      tokenIn: {
        ...mockToken,
        symbol: 'DAI',
        name: 'Dai Stablecoin',
      } as Token,
      tokenOut: {
        ...mockToken,
        id: '0x0000000000000000000000000000000000000003',
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
      } as Token,
    },
  },
};

export const DifferentAmounts: Story = {
  args: {
    swap: {
      ...mockSwap,
      amountIn: {
        ...mockAmount,
        amount: '5000000',
        formatted: '5.00',
        usdValue: '5.00',
        usdValueFormatted: '5.00',
      } as TokenAmount,
      amountOut: {
        ...mockAmount,
        amount: '2500000000000000000',
        formatted: '2.5',
        usdValue: '5.00',
        usdValueFormatted: '5.00',
      } as TokenAmount,
    },
  },
};