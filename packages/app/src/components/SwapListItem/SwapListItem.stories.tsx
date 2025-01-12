import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SwapListItem from './SwapListItem';
import spacing from '@/lib/styles/spacing';
import { zeroAddress } from 'viem';
import { base } from 'viem/chains';
import { HistoryItemType, USDC } from '@raylac/shared';

const meta = {
  title: 'SwapListItem',
  component: SwapListItem,
  args: {
    swap: {
      address: zeroAddress,
      amountOut: {
        amount: '100',
        formatted: '100',
        usdValue: '100',
        usdValueFormatted: '100',
        tokenPriceUsd: 1,
      },
      amountIn: {
        amount: '100',
        formatted: '100',
        usdValue: '100',
        usdValueFormatted: '100',
        tokenPriceUsd: 1,
      },
      tokenIn: USDC,
      tokenOut: USDC,
      relayId: '123',
      type: HistoryItemType.SWAP,
      chainId: base.id,
      timestamp: new Date().toISOString(),
      txHash: '0x123',
    },
    isPending: false,
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SwapListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
