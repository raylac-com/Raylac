import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';
import TokenLogoWithChain from './TokenLogoWithChain';
import spacing from '@/lib/styles/spacing';
import { base } from 'viem/chains';

const meta = {
  title: 'TokenLogoWithChain',
  component: TokenLogoWithChain,
  argTypes: {
    logoURI: { control: 'text' },
    chainId: { control: 'number' },
  },
  args: {
    logoURI:
      'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/eth.png',
    chainId: base.id,
  },
  decorators: [
    Story => (
      <View style={{ padding: spacing.default }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof TokenLogoWithChain>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
