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

const sync = async () => {
  const chainIds = supportedChains.map(chain => chain.id);

  const jobs = [
    syncBlocks({ chainIds }),
    syncUserOps({ chainIds }),
    syncUserActions({ chainIds }),
    syncNativeTransfers({
      announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
      chainIds,
    }),
    syncAnnouncements({
      announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
      chainIds,
    }),
    assignNativeTransfers({ chainIds }),
    syncERC20Transfers({
      announcementChainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
      chainIds,
    }),
    checkAddressBalances({ chainIds }),
    scanStealthAddresses(),
  ];

  if (process.env.ANVIL_RPC_URL) {
    console.log('ANVIL_RPC_URL is set, indexing dev chains');
    const devChainIds = devChains.map(chain => chain.id);
    const DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID = anvil.id;

    const devChainJobs = [
      syncBlocks({ chainIds: devChainIds }),
      syncUserOps({ chainIds: devChainIds }),
      syncUserActions({ chainIds: devChainIds }),
      syncNativeTransfers({
        announcementChainId: DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID,
        chainIds: devChainIds,
      }),
      syncAnnouncements({
        announcementChainId: DEV_CHAIN_ANNOUNCEMENT_CHAIN_ID,
        chainIds: devChainIds,
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
