import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SendToCard from './SendToCard';
import { zeroAddress } from 'viem';

const meta = {
  title: 'SendToCard',
  component: SendToCard,
  args: {
    toAddress: zeroAddress,
    alignCenter: false,
  },
  argTypes: {
    alignCenter: { control: 'boolean' },
  },
  decorators: [
    Story => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SendToCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const Centered: Story = {
  args: {
    alignCenter: true,
  },
};
