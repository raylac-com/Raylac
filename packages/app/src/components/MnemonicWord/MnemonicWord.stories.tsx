import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import MnemonicWord from './MnemonicWord';
const meta = {
  title: 'MnemonicWord',
  component: MnemonicWord,
  args: {
    word: 'abandon',
  },
  argTypes: {
    word: { control: 'text' },
    index: { control: 'number' },
    bgColor: { control: 'color' },
  },
  decorators: [
    Story => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof MnemonicWord>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const WithIndex: Story = {
  args: {
    word: 'abandon',
    index: 1,
  },
};

export const CustomBackground: Story = {
  args: {
    word: 'abandon',
    index: 1,
    bgColor: '#007AFF',
  },
};
