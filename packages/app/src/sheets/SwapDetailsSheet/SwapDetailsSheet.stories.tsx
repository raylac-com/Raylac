import React from 'react';
import { Button, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import SwapDetailsSheet, { SwapDetailsSheetProps } from './SwapDetailsSheet';
import spacing from '@/lib/styles/spacing';
import { SheetManager } from 'react-native-actions-sheet';
import { base, optimism } from 'viem/chains';

const args: SwapDetailsSheetProps = {
  payload: {
    amountOut: '1000000000000000000',
    amountIn: '1000000000000000000',
    usdAmountOut: '1000',
    usdAmountIn: '1000',
    tokenAddressIn: '0x0000000000000000000000000000000000000000',
    tokenAddressOut: '0x0000000000000000000000000000000000000000',
    transactions: [
      {
        hash: '0x123',
        chainId: base.id,
      },
      {
        hash: '0x123',
        chainId: optimism.id,
      },
    ],
  },
  sheetId: 'swap-details-sheet',
};

const meta = {
  title: 'SwapDetailsSheet',
  component: SwapDetailsSheet,
  args,
  decorators: [
    Story => {
      return (
        <View style={{ padding: spacing.default }}>
          <Story />
          <Button
            title="Show Swap Details Sheet"
            onPress={() => {
              SheetManager.hideAll();
              SheetManager.show('swap-details-sheet', args);
            }}
          />
        </View>
      );
    },
  ],
} satisfies Meta<typeof SwapDetailsSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
