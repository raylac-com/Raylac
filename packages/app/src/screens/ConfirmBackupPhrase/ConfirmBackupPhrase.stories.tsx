import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ConfirmBackupPhrase from './ConfirmBackupPhrase';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'ConfirmBackupPhrase',
  component: ConfirmBackupPhrase,
  argTypes: {},
  args: {
    genesisAddress: '0x0000000000000000000000000000000000000000',
  },
  decorators: [
    Story => (
      <StorybookStack.Navigator>
        <StorybookStack.Screen
          name="ConfirmBackupPhrase"
          component={() => Story()}
          options={{
            headerShown: false,
          }}
        ></StorybookStack.Screen>
      </StorybookStack.Navigator>
    ),
  ],
} satisfies Meta<typeof ConfirmBackupPhrase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
