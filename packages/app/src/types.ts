import type { AppRouter } from '@raylac/api';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { Hex } from 'viem';

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

export interface MnemonicAndKey {
  mnemonic: string;
  privKey: Hex;
}

export type GetSwapHistoryRequestBody = RouterInput['getSwapQuote'];
export type GetSwapHistoryReturnType = RouterOutput['getSwapHistory'];
