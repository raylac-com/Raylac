import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import TokenBalanceDetailsSheet from './TokenBalanceDetailsSheet';
import { base } from 'viem/chains';
import { parseUnits, toHex, zeroAddress } from 'viem';

const meta = {
  title: 'TokenBalanceDetailsSheet',
  component: TokenBalanceDetailsSheet,
  args: {
    tokenBalance: {
      name: 'USDC',
      symbol: 'USDC',
      logoUrl:
        'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
      decimals: 6,
      balance: toHex(parseUnits('100', 6)),
      usdValue: 100,
      tokenPrice: 1,
      breakdown: [
        {
          chainId: base.id,
          balance: toHex(parseUnits('100', 6)),
          tokenAddress: zeroAddress,
        },
      ],
    },
    onClose: () => {},
  },
  decorators: [Story => <Story />],
} satisfies Meta<typeof TokenBalanceDetailsSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
