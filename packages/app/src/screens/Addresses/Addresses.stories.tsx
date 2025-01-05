import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Addresses from './Addresses';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'Addresses',
  component: Addresses,
  args: {},
  decorators: [
    Story => (
      <StorybookStack.Navigator>
        <StorybookStack.Screen
          name="Addresses"
          component={() => Story()}
          options={{
            headerShown: false,
          }}
        ></StorybookStack.Screen>
      </StorybookStack.Navigator>
    ),
  ],
} satisfies Meta<typeof Addresses>;

export default meta;

type Story = StoryObj<typeof meta>;

// @ts-ignore
export const Basic: Story = {};
