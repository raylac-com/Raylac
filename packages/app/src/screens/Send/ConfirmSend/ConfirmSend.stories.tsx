import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ConfirmSend from './ConfirmSend';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getAddress } from 'viem';
import { arbitrum, base, optimism, polygon, zksync } from 'viem/chains';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'ConfirmSend',
  component: ConfirmSend,
  args: {
    route: {
      name: 'ConfirmSend',
      key: 'ConfirmSend',
      params: {
        toAddress: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
        fromAddresses: ['0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196'],
        chainId: base.id,
        amount: '5',
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
