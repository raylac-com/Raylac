import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SaveBackupPhrase from './SaveBackupPhrase';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'SaveBackupPhrase',
  component: SaveBackupPhrase,
  argTypes: {},
  args: {},
  decorators: [
    Story => (
      <NavigationContainer independent>
        <StorybookStack.Navigator>
          <StorybookStack.Screen
            name="SaveBackupPhrase"
            component={() => Story()}
            options={{
              headerShown: false,
            }}
          ></StorybookStack.Screen>
        </StorybookStack.Navigator>
      </NavigationContainer>
    ),
  ],
} satisfies Meta<typeof SaveBackupPhrase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
