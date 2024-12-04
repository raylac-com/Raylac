import React from 'react';
import { Button, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SearchTokenSheet from './SearchTokenSheet';
import spacing from '@/lib/styles/spacing';
import { SheetManager } from 'react-native-actions-sheet';

const meta = {
  title: 'SearchTokenSheet',
  component: SearchTokenSheet,
  args: {
    onSelectToken: () => {},
  },
  decorators: [
    Story => {
      return (
        <View style={{ padding: spacing.default }}>
          <Button
            title="Show Search Token Sheet"
            onPress={() => {
              SheetManager.hideAll();
              SheetManager.show('search-token-sheet');
            }}
          />
          <Story />
        </View>
      );
    },
  ],
} satisfies Meta<typeof SearchTokenSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
