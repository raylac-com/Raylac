import type { AppRouter } from '@raylac/api';
import { BuildSwapUserOpRequestBody } from '@raylac/shared';
import type { inferRouterOutputs } from '@trpc/server';
import { Hex } from 'viem';

export type RouterOutput = inferRouterOutputs<AppRouter>;

export interface MnemonicAndKeys {
  mnemonic: string;
  spendingPrivKey: Hex;
  viewingPrivKey: Hex;
}

export type SwapInput = BuildSwapUserOpRequestBody['swapInput'];
export type SwapOutput = BuildSwapUserOpRequestBody['swapOutput'];

export type SupportedToken = RouterOutput['getSupportedTokens'][number];
