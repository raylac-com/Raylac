import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SelectAmount from './SelectAmount';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { base } from 'viem/chains';
import { ETH } from '@raylac/shared';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'SelectAmount',
  component: SelectAmount,
  args: {
    route: {
      name: 'SelectAmount',
      key: 'SelectAmount',
      params: {
        chainId: base.id,
        toAddress: '0x0000000000000000000000000000000000000000',
        fromAddresses: ['0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196'],
        token: ETH,
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
