import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import StartWatch from './StartWatch';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'StartWatch',
  component: StartWatch,
  argTypes: {},
  args: {},
  decorators: [
    Story => (
      <StorybookStack.Navigator>
        <StorybookStack.Screen
          name="StartWatch"
          component={() => Story()}
          options={{
            headerShown: false,
          }}
        ></StorybookStack.Screen>
      </StorybookStack.Navigator>
    ),
  ],
} satisfies Meta<typeof StartWatch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
