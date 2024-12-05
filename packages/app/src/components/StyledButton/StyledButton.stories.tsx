import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import StyledButton from './StyledButton';
import spacing from '@/lib/styles/spacing';

const meta = {
  title: 'StyledButton',
  component: StyledButton,
  argTypes: {
    title: { control: 'text' },
    isLoading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    title: 'Swap',
    isLoading: false,
    disabled: false,
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof StyledButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
