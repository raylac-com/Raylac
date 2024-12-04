import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SwapSheet from './SwapSheet';
import spacing from '@/lib/styles/spacing';

const meta = {
  title: 'SwapSheet',
  component: SwapSheet,
  args: {},
  decorators: [
    Story => {
      return (
        <View style={{ padding: spacing.default }}>
          <Story />
        </View>
      );
    },
  ],
} satisfies Meta<typeof SwapSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
