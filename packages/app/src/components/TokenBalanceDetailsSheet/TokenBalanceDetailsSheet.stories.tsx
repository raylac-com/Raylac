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
      token: {
        name: 'USDC',
        symbol: 'USDC',
        logoURI:
          'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
        decimals: 6,
        addresses: [
          {
            chainId: base.id,
            address: zeroAddress,
          },
        ],
        verified: true,
      },
      balance: toHex(parseUnits('100', 6)),
      usdValue: '100',
      tokenPrice: '1',
      perAddressBreakdown: [
        {
          address: zeroAddress,
          breakdown: [
            {
              chainId: base.id,
              balance: toHex(parseUnits('100', 6)),
              tokenAddress: zeroAddress,
              usdValue: '100',
            },
          ],
        },
      ],
      combinedBreakdown: [
        {
          chainId: base.id,
          balance: toHex(parseUnits('100', 6)),
          tokenAddress: zeroAddress,
          usdValue: '100',
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
