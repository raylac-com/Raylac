import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SwapHistoryListItem from './SwapHistoryListItem';
import spacing from '@/lib/styles/spacing';

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
