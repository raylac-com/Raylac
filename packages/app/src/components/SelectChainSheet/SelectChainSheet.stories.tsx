import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SelectChainSheet from './SelectChainSheet';
import spacing from '@/lib/styles/spacing';
import { ETH } from '@raylac/shared';

const meta = {
  title: 'SelectChainSheet',
  component: SelectChainSheet,
  args: {
    title: 'Select Network',
    open: true,
    token: ETH,
    onSelect: () => {},
    onClose: () => {},
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default, flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SelectChainSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const Closed: Story = {
  args: {
    open: false,
  },
};

export const CustomTitle: Story = {
  args: {
    title: 'Choose a Chain',
  },
};
