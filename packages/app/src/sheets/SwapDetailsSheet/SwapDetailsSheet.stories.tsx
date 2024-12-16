import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SwapDetailsSheet from './SwapDetailsSheet';
import { zeroAddress } from 'viem';

const meta = {
  title: 'SwapDetailsSheet',
  component: SwapDetailsSheet,
  args: {
    swap: {
      address: zeroAddress,
      amountOut: '1000000000000000000',
      amountIn: '1000000000000000000',
      amountOutFormatted: '1000',
      amountInFormatted: '1000',
      amountOutUsd: '1000',
      amountInUsd: '1000',
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
      transactions: [
        {
          hash: '0x123',
        },
        {
          hash: '0x123',
        },
      ],
    },
    onClose: () => {},
  },
  decorators: [
    Story => {
      return <Story />;
    },
  ],
} satisfies Meta<typeof SwapDetailsSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
