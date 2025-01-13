import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import TransferListItemSheet from './TransferListItemSheet';
import { zeroAddress } from 'viem';
import {
  HistoryItemType,
  TransferHistoryItem,
  Token,
  TokenAmount,
} from '@raylac/shared';

const mockToken: Token = {
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
};

const mockAmount: TokenAmount = {
  amount: '1000000',
  formatted: '1.00',
  tokenPrice: {
    usd: '1',
    jpy: '140',
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
};

const mockTransfer: TransferHistoryItem = {
  type: HistoryItemType.TRANSFER,
  direction: 'incoming' as const,
  from: zeroAddress,
  to: zeroAddress,
  token: mockToken,
  amount: mockAmount,
  fromChainId: 1,
  toChainId: 137,
  txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  timestamp: new Date().toISOString(),
};

const meta = {
  title: 'TransferListItemSheet',
  component: TransferListItemSheet,
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
} satisfies Meta<typeof TransferListItemSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const OutgoingTransfer: Story = {
  args: {
    transfer: {
      ...mockTransfer,
      direction: 'outgoing' as const,
    },
  },
};
