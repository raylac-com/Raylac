import { createClient } from 'redis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not set');
}
const redis = createClient({
  url: process.env.REDIS_URL,
}) as ReturnType<typeof createClient>;

redis.connect();

export const redisClient: ReturnType<typeof createClient> = redis;
