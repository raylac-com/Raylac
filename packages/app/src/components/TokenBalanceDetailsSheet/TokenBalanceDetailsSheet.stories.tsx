import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import TokenBalanceDetailsSheet from './TokenBalanceDetailsSheet';
import { USDC } from '@raylac/shared';

const meta = {
  title: 'TokenBalanceDetailsSheet',
  component: TokenBalanceDetailsSheet,
  args: {
    token: USDC,
    onClose: () => {},
  },
  decorators: [Story => <Story />],
} satisfies Meta<typeof TokenBalanceDetailsSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
