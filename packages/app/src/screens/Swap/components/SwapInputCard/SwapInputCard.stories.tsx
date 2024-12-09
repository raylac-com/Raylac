import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SwapInputCard from './SwapInputCard';
import spacing from '@/lib/styles/spacing';
import { base } from 'viem/chains';
import { zeroAddress } from 'viem';

const meta = {
  title: 'SwapInputCard',
  component: SwapInputCard,
  argTypes: {
    token: {
      control: {
        type: 'object',
      },
    },
    amount: { control: 'text' },
    isLoadingBalance: { control: 'boolean' },
  },
  args: {
    token: {
      addresses: [
        {
          chainId: base.id,
          address: zeroAddress,
        },
      ],
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 18,
      logoURI:
        'https://firebasestorage.googleapis.com/v0/b/raylac-72351.appspot.com/o/usdc.png?alt=media&token=4e91000d-a063-4f34-bbcb-599a44151ff9',
    },
    balance: undefined,
    isLoadingBalance: false,
    amount: '100',
    setToken: () => {},
    setAmount: () => {},
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
