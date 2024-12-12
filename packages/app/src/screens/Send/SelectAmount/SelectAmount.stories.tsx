import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SelectAmount from './SelectAmount';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { base } from 'viem/chains';
import { zeroAddress } from 'viem';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'SelectAmount',
  component: SelectAmount,
  args: {
    route: {
      name: 'SelectAmount',
      key: 'SelectAmount',
      params: {
        address: '0x0000000000000000000000000000000000000000',
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
} satisfies Meta<typeof SelectAmount>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
