import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ImportAccount from './ImportAccount';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'ImportAccount',
  component: ImportAccount,
  decorators: [
    Story => (
      <StorybookStack.Navigator>
        <StorybookStack.Screen
          name="ImportAccount"
          component={() => Story()}
        ></StorybookStack.Screen>
      </StorybookStack.Navigator>
    ),
  ],
} satisfies Meta<typeof ImportAccount>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
