import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SearchTokenSheet from './SearchTokenSheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

const meta = {
  title: 'SearchTokenSheet',
  component: SearchTokenSheet,
  args: {
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
} satisfies Meta<typeof SearchTokenSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
