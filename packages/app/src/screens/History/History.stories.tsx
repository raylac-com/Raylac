import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import History from './History';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { zeroAddress } from 'viem';
import { ETH } from '@raylac/shared';
import { MOCK_TOKEN_AMOUNT } from '@/lib/utils';
import { arbitrum, base } from 'viem/chains';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'History',
  component: History,
  args: {
    route: {
      name: 'History',
      key: 'History',
      params: {
        pendingTransfer: {
          chainId: base.id,
          from: zeroAddress,
          to: zeroAddress,
          amount: MOCK_TOKEN_AMOUNT,
          token: ETH,
          //          requestId:
          //            '0xb21712263461657c43f75af3379632c8891d92aab5240bf5bdf9f6518ebfee70',
          txHash:
            '0x1306fd5df9576ee14baf2166d5e78d1efd9eb420715f15fbdb6594627b29d5b2',
        },
        pendingBridgeTransfer: {
          fromChainId: base.id,
          toChainId: arbitrum.id,
          from: zeroAddress,
          to: zeroAddress,
          amount: MOCK_TOKEN_AMOUNT,
          token: ETH,
          requestId:
            '0xb21712263461657c43f75af3379632c8891d92aab5240bf5bdf9f6518ebfee70',
        },
      },
    },
  },
  decorators: [
    Story => (
      <StorybookStack.Navigator>
        <StorybookStack.Screen
          name="History"
          component={() => Story()}
          options={{
            headerShown: false,
          }}
        ></StorybookStack.Screen>
      </StorybookStack.Navigator>
    ),
  ],
} satisfies Meta<typeof History>;

export default meta;

type Story = StoryObj<typeof meta>;

// @ts-ignore
export const Basic: Story = {};
