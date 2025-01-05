import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SwapInputCard from './SwapInputCard';
import spacing from '@/lib/styles/spacing';
import { base } from 'viem/chains';
import { USDC } from '@raylac/shared';
import { zeroAddress } from 'viem';

const meta = {
  title: 'SwapInputCard',
  component: SwapInputCard,
  args: {
    token: USDC,
    balance: undefined,
    isLoadingBalance: false,
    amount: '100',
    setToken: () => {},
    setAmount: () => {},
    chainId: base.id,
    setChainId: () => {},
    address: zeroAddress,
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SwapInputCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
