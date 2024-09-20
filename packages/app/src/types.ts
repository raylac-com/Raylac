import type { AppRouter } from '@raylac/api';
import type { inferRouterOutputs } from '@trpc/server';

export type RouterOutput = inferRouterOutputs<AppRouter>;

export type User = RouterOutput['getUser'];

export enum ServerId {
  Local = 'local',
  Production = 'production',
}
