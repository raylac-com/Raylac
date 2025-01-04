import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SaveBackupPhrase from './SaveBackupPhrase';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const StorybookStack = createNativeStackNavigator();

const meta = {
  title: 'SaveBackupPhrase',
  component: SaveBackupPhrase,
  args: {
    route: {
      name: 'SaveBackupPhrase',
      key: 'SaveBackupPhrase',
      params: {
        genesisAddress: '0x0000000000000000000000000000000000000000',
      },
    },
  },
  decorators: [
    Story => (
      <StorybookStack.Navigator>
        <StorybookStack.Screen
          name="SaveBackupPhrase"
          component={() => Story()}
          options={{
            headerShown: false,
          }}
        ></StorybookStack.Screen>
      </StorybookStack.Navigator>
    ),
  ],
} satisfies Meta<typeof SaveBackupPhrase>;

export default meta;

type Story = StoryObj<typeof meta>;

// @ts-ignore
export const Basic: Story = {};
