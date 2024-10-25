import { initLogger } from '@raylac/shared';

export const JWT_PRIV_KEY = process.env.JWT_PRIV_KEY as string;

if (!JWT_PRIV_KEY) {
  throw new Error('JWT_PRIV_KEY is required');
}

export const logger = initLogger({ serviceName: 'raylac-api' });
