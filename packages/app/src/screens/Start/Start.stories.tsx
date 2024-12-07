import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import Start from './Start';
import spacing from '@/lib/styles/spacing';

const meta = {
  title: 'Start',
  component: Start,
  argTypes: {},
  args: {},
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Start>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
