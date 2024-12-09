import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SwapDetailsSheet from './SwapDetailsSheet';
import { base, optimism } from 'viem/chains';

const meta = {
  title: 'SwapDetailsSheet',
  component: SwapDetailsSheet,
  args: {
    swap: {
      amountOut: '1000000000000000000',
      amountIn: '1000000000000000000',
      usdAmountOut: '1000',
      usdAmountIn: '1000',
      tokenAddressIn: '0x0000000000000000000000000000000000000000',
      tokenAddressOut: '0x0000000000000000000000000000000000000000',
      transactions: [
        {
          hash: '0x123',
          chainId: base.id,
        },
        {
          hash: '0x123',
          chainId: optimism.id,
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
