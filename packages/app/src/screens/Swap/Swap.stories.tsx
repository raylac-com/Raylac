import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Swap from './Swap';
import { USDC } from '@raylac/shared';

const meta = {
  title: 'Swap',
  component: Swap,
  args: {
    route: {
      key: 'Swap',
      name: 'Swap',
      params: {
        fromToken: USDC,
      },
    },
  },
  decorators: [
    Story => {
      return <Story />;
    },
  ],
} satisfies Meta<typeof Swap>;

export default meta;

type Story = StoryObj<typeof meta>;

// @ts-ignore
export const Basic: Story = {};
