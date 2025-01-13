import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import BridgeListItem from './BridgeListItem';
import spacing from '@/lib/styles/spacing';
import { zeroAddress } from 'viem';
import { base, optimism } from 'viem/chains';
import { HistoryItemType, USDC } from '@raylac/shared';

const meta = {
  title: 'BridgeListItem',
  component: BridgeListItem,
  args: {
    bridge: {
      address: zeroAddress,
      amountOut: {
        amount: '100',
        formatted: '100',
        tokenPrice: {
          usd: '1',
          jpy: '140',
        },
        currencyValue: {
          raw: {
            usd: '100',
            jpy: '14000',
          },
          formatted: {
            usd: '100',
            jpy: '14,000',
          },
        },
      },
      amountIn: {
        amount: '100',
        formatted: '100',
        tokenPrice: {
          usd: '1',
          jpy: '140',
        },
        currencyValue: {
          raw: {
            usd: '100',
            jpy: '14000',
          },
          formatted: {
            usd: '100',
            jpy: '14,000',
          },
        },
      },
      token: USDC,
      relayId: '123',
      type: HistoryItemType.BRIDGE,
      fromChainId: base.id,
      toChainId: optimism.id,
      timestamp: new Date().toISOString(),
      inTxHash: '0x123',
      outTxHash: '0x123',
    },
    isPending: false,
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof BridgeListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
