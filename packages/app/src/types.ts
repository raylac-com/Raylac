import type { AppRouter } from '@raylac/api';
import type { inferRouterOutputs } from '@trpc/server';
import { Hex } from 'viem';

export type RouterOutput = inferRouterOutputs<AppRouter>;

export interface MnemonicAndKeys {
  mnemonic: string;
  spendingPrivKey: Hex;
  viewingPrivKey: Hex;
}
