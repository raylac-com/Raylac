import type { AppRouter } from '@raylac/api';
import type { inferRouterOutputs } from '@trpc/server';

export type RouterOutput = inferRouterOutputs<AppRouter>;

export type User = RouterOutput['getUser'];

export type TransferItem = RouterOutput['getTxHistory'][0];

export type TraceItem = RouterOutput['getTransferDetails']['traces'][0];
