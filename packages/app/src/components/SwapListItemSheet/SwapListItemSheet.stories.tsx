import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SwapListItemSheet from './SwapListItemSheet';
import { zeroAddress } from 'viem';
import {
  HistoryItemType,
  SwapHistoryItem,
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

const mockSwap: SwapHistoryItem = {
  type: HistoryItemType.SWAP,
  relayId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  address: zeroAddress,
  tokenIn: mockToken,
  tokenOut: {
    ...mockToken,
    id: '0x0000000000000000000000000000000000000002',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
  },
  amountIn: mockAmount,
  amountOut: {
    ...mockAmount,
    amount: '500000000000000000',
    formatted: '0.5',
    tokenPrice: {
      usd: '2000',
      jpy: '280000',
    },
    currencyValue: {
      raw: {
        usd: '1000',
        jpy: '140000',
      },
      formatted: {
        usd: '1,000',
        jpy: '140,000',
      },
    },
  },
  chainId: 1,
  timestamp: new Date().toISOString(),
  txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
};

const meta = {
  title: 'SwapListItemSheet',
  component: SwapListItemSheet,
  args: {
    swap: mockSwap,
    onClose: () => {},
  },
  decorators: [
    Story => (
      <View style={{ padding: 16, flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SwapListItemSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const DifferentTokens: Story = {
  args: {
    swap: {
      ...mockSwap,
      tokenIn: {
        ...mockToken,
        symbol: 'DAI',
        name: 'Dai Stablecoin',
      } as Token,
      tokenOut: {
        ...mockToken,
        id: '0x0000000000000000000000000000000000000003',
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
      } as Token,
    },
  },
};

export const DifferentAmounts: Story = {
  args: {
    swap: {
      ...mockSwap,
      amountIn: {
        ...mockAmount,
        amount: '5000000',
        formatted: '5.00',
        tokenPrice: {
          usd: '1',
          jpy: '140',
        },
        currencyValue: {
          raw: {
            usd: '5.00',
            jpy: '700.00',
          },
          formatted: {
            usd: '5.00',
            jpy: '700.00',
          },
        },
      } as TokenAmount,
      amountOut: {
        ...mockAmount,
        amount: '2500000000000000000',
        formatted: '2.5',
        tokenPrice: {
          usd: '2',
          jpy: '280',
        },
        currencyValue: {
          raw: {
            usd: '5.00',
            jpy: '700.00',
          },
          formatted: {
            usd: '5.00',
            jpy: '700.00',
          },
        },
      } as TokenAmount,
    },
  },
};
