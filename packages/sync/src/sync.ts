import syncBlocks from './manageReorgs';
import syncNativeTransfers from './syncNativeTransfers';
import syncERC20Transfers from './syncERC20Transfers';
import syncAnnouncements from './syncAnnouncements';
import scanStealthAddresses from './scanStealthAddresses';
// import { announceStealthAccounts } from './announceStealthAccounts';
import checkAddressBalances from './checkAddressBalances';
import assignNativeTransfers from './assignNativeTransfers';
import syncUserOps from './syncUserOps';
import syncUserActions from './syncUserActions';
import { anvil } from 'viem/chains';
import {
  devChains,
  ERC5564_ANNOUNCEMENT_CHAIN,
  supportedChains,
} from '@raylac/shared';
import { logger } from '@raylac/shared-backend';

const runAnvil =
  process.env.RENDER !== 'true' || process.env.IS_PULL_REQUEST === 'true';

const sync = async () => {
  const chainIds = supportedChains.map(chain => chain.id);

  const jobs = [
    syncBlocks({ chainIds }),
    syncUserOps({
      announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
      chainIds,
    }),
    syncUserActions({ chainIds }),
    syncNativeTransfers({
      announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
      chainIds,
    }),
    syncAnnouncements({
      announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
    }),
    assignNativeTransfers({ chainIds }),
    syncERC20Transfers({
      announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
      chainIds,
    }),
    checkAddressBalances({ chainIds }),
    scanStealthAddresses(),
  ];

  if (runAnvil) {
    logger.info('ANVIL_RPC_URL is set, indexing anvil');

    const devChainIds = devChains.map(chain => chain.id);
    const DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID = anvil.id;

    const devChainJobs = [
      syncBlocks({ chainIds: devChainIds }),
      syncUserOps({
        announcementChainId: DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID,
        chainIds: devChainIds,
      }),
      syncUserActions({ chainIds: devChainIds }),
      syncNativeTransfers({
        announcementChainId: DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID,
        chainIds: devChainIds,
      }),
      syncAnnouncements({
        announcementChainId: DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID,
      }),
      assignNativeTransfers({ chainIds: devChainIds }),
      syncERC20Transfers({
        announcementChainId: DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID,
        chainIds: devChainIds,
      }),
      checkAddressBalances({ chainIds: devChainIds }),
      scanStealthAddresses(),
    ];

    jobs.push(...devChainJobs);
  }

  await Promise.all(jobs);
};

export default sync;
