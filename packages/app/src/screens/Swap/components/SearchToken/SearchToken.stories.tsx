import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SearchToken from './SearchToken';
import spacing from '@/lib/styles/spacing';

const meta = {
  title: 'SearchToken',
  component: SearchToken,
  args: {
    onSelectToken: () => {},
  },
  decorators: [
    Story => {
      return (
        <View style={{ padding: spacing.default }}>
          <Story />
        </View>
      );
    },
  ],
} satisfies Meta<typeof SearchToken>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
