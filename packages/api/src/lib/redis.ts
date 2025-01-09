import { createClient } from 'redis';
import { REDIS_URL } from './envVars';
import { logger } from '@raylac/shared-backend';

const redis = createClient({
  url: REDIS_URL,
}) as ReturnType<typeof createClient>;

if (process.env.MOCK_RESPONSE !== 'true') {
  redis.connect();
} else {
  logger.info('Skipping Redis connection in mock mode');
}

export const redisClient: ReturnType<typeof createClient> = redis;
