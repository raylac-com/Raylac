import 'dotenv/config';

const getEnvVar = <T>(key: string): T => {
  // eslint-disable-next-line security/detect-object-injection
  const value = process.env[key];

  if (!value && process.env.MOCK_RESPONSE !== 'true') {
    throw new Error(`${key} is not set`);
  }

  return value as T;
};

export const ALCHEMY_API_KEY = getEnvVar<string>('ALCHEMY_API_KEY');
export const QUICK_NODE_API_KEY = getEnvVar<string>('QUICKNODE_API_KEY');
export const REDIS_URL = getEnvVar<string>('REDIS_URL');
export const EXCHANGE_RATE_API_KEY = getEnvVar<string>('EXCHANGE_RATE_API_KEY');
