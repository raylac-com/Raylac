import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ImportAccount from './ImportAccount';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'ImportAccount',
  component: ImportAccount,
  argTypes: {},
  args: {},
  decorators: [
    Story => (
      <NavigationContainer independent>
        <StorybookStack.Navigator>
          <StorybookStack.Screen
            name="ImportAccount"
            component={() => Story()}
            options={{
              headerShown: false,
            }}
          ></StorybookStack.Screen>
        </StorybookStack.Navigator>
      </NavigationContainer>
    ),
  ],
} satisfies Meta<typeof ImportAccount>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
