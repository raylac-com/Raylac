import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SearchInputAccessory from './SearchInputAccessory';

const meta = {
  title: 'SearchInputAccessory',
  component: SearchInputAccessory,
  args: {
    onClear: () => {},
    onPaste: () => {},
    inputAccessoryViewID: 'search-input',
  },
  decorators: [
    Story => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SearchInputAccessory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const WithCustomHandlers: Story = {
  args: {
    onClear: () => {},
    onPaste: () => {},
    inputAccessoryViewID: 'custom-search-input',
  },
};
