import { supportedChains } from '@raylac/shared';
import sync from './sync';

export const start = async () => {
  await sync({ chainIds: supportedChains.map(chain => chain.id) });
};

start();
