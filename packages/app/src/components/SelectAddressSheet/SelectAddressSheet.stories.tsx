import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SelectAddressSheet from './SelectAddressSheet';

const meta = {
  title: 'SelectAddressSheet',
  component: SelectAddressSheet,
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
} satisfies Meta<typeof SelectAddressSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  parameters: {
    notes: 'Basic usage with default props',
  },
};

export const Closed: Story = {
  args: {
    open: false,
  },
  parameters: {
    notes: 'Sheet in closed state',
  },
};

export const WithCustomHandlers: Story = {
  args: {
    onSelect: () => {},
    onClose: () => {},
  },
  parameters: {
    notes: 'Sheet with custom handlers',
  },
};
