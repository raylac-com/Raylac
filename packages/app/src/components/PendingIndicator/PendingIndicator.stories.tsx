import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import PendingIndicator from './PendingIndicator';

const meta = {
  title: 'PendingIndicator',
  component: PendingIndicator,
  decorators: [
    Story => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof PendingIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
