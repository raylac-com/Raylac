import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ConfirmBackupPhrase from './ConfirmBackupPhrase';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { zeroAddress } from 'viem';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'ConfirmBackupPhrase',
  component: ConfirmBackupPhrase,
  args: {
    route: {
      name: 'ConfirmBackupPhrase',
      key: 'ConfirmBackupPhrase',
      params: {
        genesisAddress: zeroAddress,
      },
    },
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

// @ts-ignore
export const Basic: Story = {};
