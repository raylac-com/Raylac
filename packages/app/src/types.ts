import type { AppRouter } from '@raylac/api';
import type { inferRouterOutputs } from '@trpc/server';
import { Hex } from 'viem';

export type RouterOutput = inferRouterOutputs<AppRouter>;

export type User = RouterOutput['getUser'];

export type TransferItem = RouterOutput['getTxHistory'][0];

export type TraceItem = RouterOutput['getTransferDetails']['traces'][0];

export type AddressOrUser =
  | string
  | { spendingPubKey?: string; profileImage?: string; name?: string };

export interface MnemonicAndKeys {
  mnemonic: string;
  spendingPrivKey: Hex;
  viewingPrivKey: Hex;
}
