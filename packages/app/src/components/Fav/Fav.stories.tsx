import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import Fav from './Fav';
import colors from '@/lib/styles/colors';

const meta = {
  title: 'Fav',
  component: Fav,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          padding: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Story />
        </View>
      </View>
    ),
  ],
} satisfies Meta<typeof Fav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A floating action button that expands to show menu items when clicked.',
      },
    },
  },
};
