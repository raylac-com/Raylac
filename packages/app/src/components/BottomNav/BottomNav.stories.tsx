import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import BottomNav from './BottomNav';
import { View } from 'react-native';

const meta = {
  title: 'BottomNav',
  component: BottomNav,
  args: {},
  decorators: [
    Story => {
      return (
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: 16,
          }}
        >
          <Story />
        </View>
      );
    },
  ],
} satisfies Meta<typeof BottomNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
