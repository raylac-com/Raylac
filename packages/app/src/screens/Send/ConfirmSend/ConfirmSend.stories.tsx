import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ConfirmSend from './ConfirmSend';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { zeroAddress } from 'viem';
import { base } from 'viem/chains';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'ConfirmSend',
  component: ConfirmSend,
  args: {
    route: {
      name: 'ConfirmSend',
      key: 'ConfirmSend',
      params: {
        address: '0x0000000000000000000000000000000000000000',
        outputChainId: base.id,
        amount: '1',
        token: {
          symbol: 'ETH',
          name: 'Ethereum',
          verified: true,
          addresses: [
            {
              chainId: base.id,
              address: zeroAddress,
            },
          ],
          decimals: 18,
          logoURI:
            'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
        },
      },
    },
  },
  decorators: [
    Story => (
      <StorybookStack.Navigator>
        <StorybookStack.Screen
          name="Home"
          component={() => Story()}
          options={{
            headerShown: false,
          }}
        ></StorybookStack.Screen>
      </StorybookStack.Navigator>
    ),
  ],
} satisfies Meta<typeof ConfirmSend>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
