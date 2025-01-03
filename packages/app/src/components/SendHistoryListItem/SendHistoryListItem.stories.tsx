import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import spacing from '@/lib/styles/spacing';
import SendHistoryListItem from './SendHistoryListItem';
import { arbitrum, polygon, zksync } from 'viem/chains';
import { base, optimism } from 'viem/chains';
import { getAddress } from 'viem';
import { HistoryItemType } from '@raylac/shared';

const meta = {
  title: 'SendHistoryListItem',
  component: SendHistoryListItem,
  args: {
    transfer: {
      txHash: '0x123',
      chainId: base.id,
      type: HistoryItemType.OUTGOING,
      token: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        verified: true,
        logoURI:
          'https://coin-images.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
        addresses: [
          {
            chainId: base.id,
            address: getAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
          },
          {
            chainId: optimism.id,
            address: getAddress('0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'),
          },
          {
            chainId: arbitrum.id,
            address: getAddress('0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
          },
          {
            chainId: polygon.id,
            address: getAddress('0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'),
          },
          {
            chainId: zksync.id,
            address: getAddress('0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4'),
          },
        ],
      },
      from: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
      to: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
      amount: {
        balance: '1000000',
        formatted: '1000000',
        usdValue: '0.9999452727',
        usdValueFormatted: '0.9999452727',
        tokenPriceUsd: 0.0000009999452727,
      },
      timestamp: Date.now().toString(),
    },
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SendHistoryListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

// @ts-ignore
export const Basic: Story = {};
