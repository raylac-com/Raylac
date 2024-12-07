import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ConfirmBackupPhrase from './ConfirmBackupPhrase';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'ConfirmBackupPhrase',
  component: ConfirmBackupPhrase,
  argTypes: {},
  args: {},
  decorators: [
    Story => (
      <NavigationContainer independent>
        <StorybookStack.Navigator>
          <StorybookStack.Screen
            name="ConfirmBackupPhrase"
            component={() => Story()}
            options={{
              headerShown: false,
            }}
          ></StorybookStack.Screen>
        </StorybookStack.Navigator>
      </NavigationContainer>
    ),
  ],
} satisfies Meta<typeof ConfirmBackupPhrase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
