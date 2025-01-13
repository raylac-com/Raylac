import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import MultiSelectAddressSheet from './MultiSelectAddressSheet';

const meta = {
  title: 'MultiSelectAddressSheet',
  component: MultiSelectAddressSheet,
  args: {
    open: true,
    onSelect: () => {},
    onClose: () => {},
  },
  parameters: {
    notes: 'A bottom sheet component for selecting Ethereum addresses.',
  },
  decorators: [
    Story => (
      <View style={{ padding: 16, flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof MultiSelectAddressSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  parameters: {
    notes: 'Basic usage with default props',
  },
};
