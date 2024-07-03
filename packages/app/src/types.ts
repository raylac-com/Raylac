import type { AppRouter } from '@sutori/api';
import type { inferRouterOutputs } from '@trpc/server';
import { Hex } from 'viem';


export type RouterOutput = inferRouterOutputs<AppRouter>;

export type User = RouterOutput["getUser"];

export interface StealthAccount {
  address: Hex;
  viewTag: string;
  stealthPubKey: Hex;
  ephemeralPubKey: Hex;
}
