import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SendDetailsSheet from './SendDetailsSheet';
import { arbitrum, base, optimism, polygon, zksync } from 'viem/chains';
import { getAddress } from 'viem';

const meta = {
  title: 'SendDetailsSheet',
  component: SendDetailsSheet,
  args: {
    sendDetails: {
      inputAmount: '5004339',
      inputAmountFormatted: '5.004339',
      inputAmountUsd: '4.9991046810964821',
      outputAmount: '5000000',
      outputAmountFormatted: '5',
      outputAmountUsd: '4.9947702195',
      bridgeFee: '4339',
      bridgeFeeFormatted: '0.004339',
      bridgeFeeUsd: '0.0043344615964821',
      bridgeSteps: [
        {
          tx: {
            to: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
            data: '0xa9059cbb000000000000000000000000f70da97812cb96acdf810712aa562db8dfa3dbef00000000000000000000000000000000000000000000000000000000004c284806fc29153bd5a5ae85ea35fcc41800f20bdacfbfe761a10930bbfcb40fdf33e0',
            value: '0',
            maxFeePerGas: '11000000',
            maxPriorityFeePerGas: '0',
            nonce: 9,
            chainId: 42161,
            gas: 5000000,
          },
          bridgeDetails: {
            to: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
            amountIn: '5000000',
            amountOut: '5000000',
            amountInFormatted: '4.991048',
            amountOutFormatted: '4.988381',
            bridgeFee: '2667',
            bridgeFeeFormatted: '0.002667',
            bridgeFeeUsd: '0.002665',
            fromChainId: 42161,
            toChainId: 10,
          },
          serializedTx: '0x',
        },
        {
          tx: {
            to: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            data: '0xa9059cbb000000000000000000000000f70da97812cb96acdf810712aa562db8dfa3dbef00000000000000000000000000000000000000000000000000000000000033eb9b326426c9f36d51b74c9765efeec347b0bba536e1ccc7750b7fb74ea1b45b59',
            value: '0',
            maxFeePerGas: '3693552',
            maxPriorityFeePerGas: '1115938',
            nonce: 53,
            chainId: 8453,
            gas: 5000000,
          },
          bridgeDetails: {
            to: '0x28341dF2CCabe2Cc4A3c6e7ef2fe9E706680C196',
            amountIn: '5000000',
            amountOut: '5000000',
            amountInFormatted: '4.991048',
            amountOutFormatted: '4.988381',
            bridgeFee: '2667',
            bridgeFeeFormatted: '0.002667',
            bridgeFeeUsd: '0.002665',
            fromChainId: 8453,
            toChainId: 10,
          },
          serializedTx: '0x',
        },
      ],
      transferStep: {
        tx: {
          to: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          data: '0xa9059cbb000000000000000000000000400ea6522867456e988235675b9cb5b1cf5b79c800000000000000000000000000000000000000000000000000000000004c4b40',
          value: '0',
          maxFeePerGas: '1001366',
          maxPriorityFeePerGas: '1000000',
          nonce: 0,
          chainId: 10,
          gas: 5000000,
        },
        transferDetails: {
          to: '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8',
          amount: '5000000',
          amountFormatted: '5',
          amountUsd: '0',
          chainId: 10,
        },
        serializedTx: '0x',
      },
    },
    token: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      verified: true,
      logoURI:
        'https://coin-images.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
      addresses: [
        {
          chainId: base.id,
          address: getAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
        },
        {
          chainId: optimism.id,
          address: getAddress('0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'),
        },
        {
          chainId: arbitrum.id,
          address: getAddress('0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
        },
        {
          chainId: polygon.id,
          address: getAddress('0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'),
        },
        {
          chainId: zksync.id,
          address: getAddress('0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4'),
        },
      ],
    },
    onClose: () => {},
  },
  decorators: [Story => <Story />],
} satisfies Meta<typeof SendDetailsSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
