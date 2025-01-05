import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SearchInputTokenSheet from './SearchInputTokenSheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { zeroAddress } from 'viem';

const meta = {
  title: 'SearchInputTokenSheet',
  component: SearchInputTokenSheet,
  args: {
    address: zeroAddress,
    open: true,
    onSelectToken: () => {},
    onClose: () => {},
  },
  decorators: [
    Story => {
      return (
        <BottomSheetModalProvider>
          <Story />
        </BottomSheetModalProvider>
      );
    },
  ],
} satisfies Meta<typeof SearchInputTokenSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
