import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SwapHistoryListItem from './SwapHistoryListItem';
import spacing from '@/lib/styles/spacing';
import { zeroAddress } from 'viem';
import { base, optimism } from 'viem/chains';

const meta = {
  title: 'SwapHistoryListItem',
  component: SwapHistoryListItem,
  argTypes: {
    swap: { control: 'object' },
  },
  args: {
    swap: {
      address: zeroAddress,
      amountOut: '100',
      amountIn: '100',
      amountInUsd: '100',
      amountOutUsd: '100',
      amountInFormatted: '100',
      amountOutFormatted: '100',
      tokenIn: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        verified: true,
        logoURI:
          'https://coin-images.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
        addresses: [],
      },
      tokenOut: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        verified: true,
        logoURI:
          'https://coin-images.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
        addresses: [],
      },
      lineItems: [
        {
          fromChainId: base.id,
          toChainId: optimism.id,
          txHash: '0x123',
        },
      ],
    },
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SwapHistoryListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
