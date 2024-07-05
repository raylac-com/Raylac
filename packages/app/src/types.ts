import type { AppRouter } from '@sutori/api';
import type { inferRouterOutputs } from '@trpc/server';

export type RouterOutput = inferRouterOutputs<AppRouter>;

export type User = RouterOutput['getUser'];
