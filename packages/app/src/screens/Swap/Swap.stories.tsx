import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Swap from './Swap';

const meta = {
  title: 'Swap',
  component: Swap,
  args: {},
  decorators: [
    Story => {
      return <Story />;
    },
  ],
} satisfies Meta<typeof Swap>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
