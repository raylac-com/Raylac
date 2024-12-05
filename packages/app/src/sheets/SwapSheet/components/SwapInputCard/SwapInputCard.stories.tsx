import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SwapInputCard from './SwapInputCard';
import spacing from '@/lib/styles/spacing';
import { parseEther } from 'viem';
import { base } from 'viem/chains';

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
  },
  args: {
    token: {
      addresses: [
        {
          chainId: base.id,
          address: '0x833589fCD6eDb6E08B1Daf284d278AC3b223312',
        },
      ],
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 18,
      logoURI:
        'https://firebasestorage.googleapis.com/v0/b/raylac-72351.appspot.com/o/usdc.png?alt=media&token=4e91000d-a063-4f34-bbcb-599a44151ff9',
    },
    balance: parseEther('1000'),
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
