import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Home from './Home';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'Home',
  component: Home,
  argTypes: {},
  args: {},
  decorators: [
    Story => (
      <StorybookStack.Navigator>
        <StorybookStack.Screen
          name="Home"
          component={() => Story()}
          options={{
            headerShown: false,
          }}
        ></StorybookStack.Screen>
      </StorybookStack.Navigator>
    ),
  ],
} satisfies Meta<typeof Home>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
