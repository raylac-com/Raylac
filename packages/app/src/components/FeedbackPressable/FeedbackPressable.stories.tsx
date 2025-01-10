import React from 'react';
import { View, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import FeedbackPressable from './FeedbackPressable';

const meta = {
  title: 'FeedbackPressable',
  component: FeedbackPressable,
  args: {
    onPress: () => {},
    children: <Text style={{ color: '#000' }}>{'Press me'}</Text>,
    style: {
      padding: 16,
      backgroundColor: '#f0f0f0',
      borderRadius: 8,
    },
  },
  decorators: [
    Story => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof FeedbackPressable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const CustomStyle: Story = {
  args: {
    style: {
      padding: 24,
      backgroundColor: '#e0e0e0',
      borderRadius: 16,
    },
    children: <Text style={{ color: '#000' }}>{'Custom Style Button'}</Text>,
  },
};

export const WithIcon: Story = {
  args: {
    style: {
      padding: 16,
      backgroundColor: '#f0f0f0',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    children: (
      <>
        <Text>{'🔍'}</Text>
        <Text style={{ color: '#000' }}>{'Search'}</Text>
      </>
    ),
  },
};
