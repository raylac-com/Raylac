import type { AppRouter } from '@raylac/api';
import type { inferRouterOutputs } from '@trpc/server';
import { Hex } from 'viem';

export type RouterOutput = inferRouterOutputs<AppRouter>;

export interface MnemonicAndKey {
  mnemonic: string;
  privKey: Hex;
}
