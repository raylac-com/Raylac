import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SearchOutputTokenSheet from './SearchOutputTokenSheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

const meta = {
  title: 'SearchOutputTokenSheet',
  component: SearchOutputTokenSheet,
  args: {
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
} satisfies Meta<typeof SearchOutputTokenSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
