import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import StyledText from './StyledText';
import spacing from '@/lib/styles/spacing';

const meta = {
  title: 'StyledText',
  component: StyledText,
  argTypes: {
    children: { control: 'text' },
  },
  args: {
    children: 'Hello, world!',
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof StyledText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
