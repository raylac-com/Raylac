import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import TokenBalanceItem from './TokenBalanceItem';
import spacing from '@/lib/styles/spacing';
import { parseUnits } from 'viem';

const meta = {
  title: 'TokenBalanceItem',
  component: TokenBalanceItem,
  argTypes: {
    name: { control: 'text' },
    symbol: { control: 'text' },
    usdValue: { control: 'text' },
  },
  args: {
    name: 'USD Coin',
    symbol: 'USDC',
    usdValue: '100',
    logoUrl:
      'https://firebasestorage.googleapis.com/v0/b/raylac-72351.appspot.com/o/usdc.png?alt=media&token=4e91000d-a063-4f34-bbcb-599a44151ff9',
    balance: parseUnits('100', 6),
    tokenDecimals: 6,
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof TokenBalanceItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};