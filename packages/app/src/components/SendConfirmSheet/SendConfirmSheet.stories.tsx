import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SendConfirmSheet from './SendConfirmSheet';
import { MOCK_TOKEN_AMOUNT, USDC } from '@raylac/shared';
import { zeroAddress } from 'viem';
import { arbitrum, base } from 'viem/chains';

const meta = {
  title: 'SendConfirmSheet',
  component: SendConfirmSheet,
  args: {
    fromAddress: zeroAddress,
    toAddress: zeroAddress,
    amount: MOCK_TOKEN_AMOUNT,
    fromChainId: base.id,
    toChainId: arbitrum.id,
    token: USDC,
    open: true,
    onClose: () => {},
    onConfirm: () => {},
    isSending: false,
  },
  decorators: [
    Story => {
      return <Story />;
    },
  ],
} satisfies Meta<typeof SendConfirmSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
