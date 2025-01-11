import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import AddressDetailsSheet from './AddressDetailsSheet';
import { AddressType } from '../../types';

const meta = {
  title: 'AddressDetailsSheet',
  component: AddressDetailsSheet,
  args: {
    address: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
    addressType: AddressType.Mnemonic,
    onClose: () => {},
  },
  decorators: [
    Story => (
      <View style={{ padding: 16, flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof AddressDetailsSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MnemonicAddress: Story = {};

export const PrivateKeyAddress: Story = {
  args: {
    addressType: AddressType.PrivateKey,
  },
};

export const WatchAddress: Story = {
  args: {
    addressType: AddressType.Watch,
  },
};
