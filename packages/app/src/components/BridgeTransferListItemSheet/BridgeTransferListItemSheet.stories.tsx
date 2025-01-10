import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import BridgeTransferListItemSheet from './BridgeTransferListItemSheet';
import { zeroAddress } from 'viem';
import { BridgeTransferHistoryItem, HistoryItemType } from '@raylac/shared';

const mockTransfer: BridgeTransferHistoryItem = {
  direction: 'incoming' as const,
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
    usdValue: '1.00',
    usdValueFormatted: '1.00',
    tokenPriceUsd: 1.0,
  },
  fromChainId: 1,
  toChainId: 137,
  inTxHash:
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  outTxHash:
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  timestamp: new Date().getTime().toString(),
  relayId: '123',
  type: HistoryItemType.BRIDGE_TRANSFER,
};

const meta = {
  title: 'BridgeTransferListItemSheet',
  component: BridgeTransferListItemSheet,
  args: {
    transfer: mockTransfer,
    onClose: () => {},
  },
  decorators: [
    Story => (
      <View style={{ padding: 16, flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof BridgeTransferListItemSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const OutgoingTransfer: Story = {
  args: {
    transfer: {
      ...mockTransfer,
      direction: 'outgoing',
    },
  },
};
