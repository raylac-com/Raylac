import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import TokenLogo from './TokenLogo';
import { View } from 'react-native';

const meta = {
  title: 'TokenLogo',
  component: TokenLogo,
  args: {
    source: {
      uri: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.pn',
    },
    style: {
      width: 32,
      height: 32,
    },
  },
  decorators: [
    Story => {
      return (
        <View style={{ width: 100, height: 100 }}>
          <Story />
        </View>
      );
    },
  ],
} satisfies Meta<typeof TokenLogo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
