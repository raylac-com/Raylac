import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import TransferListItem from './TransferListItem';
import { zeroAddress } from 'viem';
import { HistoryItemType, TransferHistoryItem } from '@raylac/shared';

const mockTransfer: TransferHistoryItem = {
  type: HistoryItemType.TRANSFER,
  direction: 'incoming',
  from: zeroAddress,
  to: zeroAddress,
  token: {
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
  },
  amount: {
    amount: '1000000',
    formatted: '1.00',
    tokenPrice: {
      usd: '1.00',
      jpy: '140.00',
    },
    currencyValue: {
      raw: {
        usd: '1.00',
        jpy: '140.00',
      },
      formatted: {
        usd: '1.00',
        jpy: '140.00',
      },
    },
  },
  fromChainId: 1,
  toChainId: 137,
  txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  timestamp: new Date().toISOString(),
};

const meta = {
  title: 'TransferListItem',
  component: TransferListItem,
  args: {
    transfer: mockTransfer,
    isPending: false,
  },
  argTypes: {
    isPending: { control: 'boolean' },
  },
  decorators: [
    Story => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof TransferListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const Pending: Story = {
  args: {
    isPending: true,
  },
};

export const OutgoingTransfer: Story = {
  args: {
    transfer: {
      ...mockTransfer,
      direction: 'outgoing',
    },
  },
};

export const PendingOutgoingTransfer: Story = {
  args: {
    transfer: {
      ...mockTransfer,
      direction: 'outgoing',
    },
    isPending: true,
  },
};
