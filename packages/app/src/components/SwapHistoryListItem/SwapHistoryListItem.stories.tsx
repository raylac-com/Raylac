import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SwapHistoryListItem from './SwapHistoryListItem';
import spacing from '@/lib/styles/spacing';
import { zeroAddress } from 'viem';

const meta = {
  title: 'SwapHistoryListItem',
  component: SwapHistoryListItem,
  argTypes: {
    swap: { control: 'object' },
  },
  args: {
    swap: {
      amountOut: '100',
      amountIn: '100',
      usdAmountIn: '100',
      usdAmountOut: '100',
      tokenAddressIn: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
      tokenAddressOut: zeroAddress,
    },
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SwapHistoryListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
