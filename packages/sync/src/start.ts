import { devChains, ERC5564_ANNOUNCEMENT_CHAIN } from '@raylac/shared';
import sync from './sync';

export const start = async () => {
  await sync({
    announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
    chainIds: devChains.map(chain => chain.id),
  });
};

start();
