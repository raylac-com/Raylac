import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import spacing from '@/lib/styles/spacing';
import SendHistoryListItem from './SendHistoryListItem';
import { arbitrum, polygon, zksync } from 'viem/chains';
import { base, optimism } from 'viem/chains';
import { getAddress } from 'viem';

const meta = {
  title: 'SendHistoryListItem',
  component: SendHistoryListItem,
  args: {
    transfer: {
      destinationChainId: base.id,
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
      txHash:
        '0x0b6edba17459fd482d72989b785bd985f22ae6bbc0821bc5aecafe6855dec589',
      from: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
      to: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
      amount: '1000000',
      amountUsd: '0.9999452727',
      bridges: [
        {
          txHash:
            '0x87bd3f213b62b1344ec34f430f0cbd2d3d6c61652bda071ffb610ada7721083e',
          fromChainId: 10,
          toChainId: 42161,
          amountIn: '1015550',
          amountOut: '1000000',
          bridgeFeeAmount: '15550',
          bridgeFeeUsd: '0.015533',
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
} satisfies Meta<typeof SendHistoryListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

// @ts-ignore
export const Basic: Story = {};
