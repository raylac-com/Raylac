import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import WalletIconAddress from './WalletIconAddress';
import { zeroAddress } from 'viem';
import spacing from '@/lib/styles/spacing';

const meta = {
  title: 'WalletIconAddress',
  component: WalletIconAddress,
  args: {
    address: zeroAddress,
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof WalletIconAddress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const CustomAddress: Story = {
  args: {
    address: '0x1234567890123456789012345678901234567890',
  },
};

export const AnotherAddress: Story = {
  args: {
    address: '0x9876543210987654321098765432109876543210',
  },
};
