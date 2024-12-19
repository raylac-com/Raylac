import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@raylac/api';

export const trpc = createTRPCReact<AppRouter>();
