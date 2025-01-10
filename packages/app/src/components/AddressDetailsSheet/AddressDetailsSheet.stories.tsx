import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import AddressDetailsSheet from './AddressDetailsSheet';
import { zeroAddress } from 'viem';
import { AddressType } from '../../types';

const meta = {
  title: 'AddressDetailsSheet',
  component: AddressDetailsSheet,
  args: {
    address: zeroAddress,
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
