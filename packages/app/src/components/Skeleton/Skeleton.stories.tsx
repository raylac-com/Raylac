import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import Skeleton from './Skeleton';
import spacing from '@/lib/styles/spacing';

const meta = {
  title: 'Skeleton',
  component: Skeleton,
  argTypes: {
    style: { control: false },
  },
  args: {
    style: { width: 100, height: 30 },
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
