import React from 'react';
import { Button, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SwapSheet from './SwapSheet';
import spacing from '@/lib/styles/spacing';
import { SheetManager } from 'react-native-actions-sheet';

const meta = {
  title: 'SwapSheet',
  component: SwapSheet,
  args: {},
  decorators: [
    Story => {
      return (
        <View style={{ padding: spacing.default }}>
          <Button
            title="Show Swap Sheet"
            onPress={() => {
              SheetManager.hideAll();
              SheetManager.show('swap-sheet');
            }}
          />
          <Story />
        </View>
      );
    },
  ],
} satisfies Meta<typeof SwapSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
