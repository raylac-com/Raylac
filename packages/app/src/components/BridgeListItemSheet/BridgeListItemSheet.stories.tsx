import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import BridgeListItemSheet from './BridgeListItemSheet';
import { zeroAddress } from 'viem';
import {
  BridgeHistoryItem,
  ETH,
  HistoryItemType,
  MOCK_TOKEN_AMOUNT,
} from '@raylac/shared';
import { base, optimism } from 'viem/chains';

const mockBridge: BridgeHistoryItem = {
  type: HistoryItemType.BRIDGE,
  relayId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  address: zeroAddress,
  token: ETH,
  fromChainId: base.id,
  toChainId: optimism.id,
  amountIn: MOCK_TOKEN_AMOUNT,
  amountOut: MOCK_TOKEN_AMOUNT,
  timestamp: new Date().toISOString(),
  inTxHash:
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  outTxHash:
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
};

const meta = {
  title: 'BridgeListItemSheet',
  component: BridgeListItemSheet,
  args: {
    bridge: mockBridge,
    onClose: () => {},
  },
  decorators: [
    Story => (
      <View style={{ padding: 16, flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof BridgeListItemSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
