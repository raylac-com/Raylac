import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import ChainLogo from './ChainLogo';

const meta = {
  title: 'ChainLogo',
  component: ChainLogo,
  args: {
    chainId: 1, // Ethereum mainnet
    size: 32,
  },
  argTypes: {
    chainId: { control: 'number' },
    size: { control: 'number' },
  },
  decorators: [
    Story => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ChainLogo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const Polygon: Story = {
  args: {
    chainId: 137, // Polygon mainnet
    size: 32,
  },
};

export const LargeSize: Story = {
  args: {
    chainId: 1,
    size: 64,
  },
};
