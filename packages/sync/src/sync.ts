import syncBlocks from './manageReorgs';
import syncNativeTransfers from './syncNativeTransfers';
import syncERC20Transfers from './syncERC20Transfers';
import syncAnnouncements from './syncAnnouncements';
import scanStealthAddresses from './scanStealthAddresses';
// import { announceStealthAccounts } from './announceStealthAccounts';
import checkAddressBalances from './checkAddressBalances';
import assignNativeTransfers from './assignNativeTransfers';
import syncUserOps from './syncUserOps';
import syncMultiChainTransfers from './syncMultiChainTransfers';
import syncSingleChainTransfers from './syncSingleChainTransfers';

const sync = async ({
  announcementChainId,
  chainIds,
}: {
  announcementChainId: number;
  chainIds: number[];
}) => {
  await Promise.all([
    syncBlocks({ chainIds }),
    syncUserOps({ chainIds }),
    syncMultiChainTransfers({ chainIds }),
    syncSingleChainTransfers({ chainIds }),
    syncNativeTransfers({ announcementChainId, chainIds }),
    syncAnnouncements({ announcementChainId, chainIds }),
    assignNativeTransfers({ chainIds }),
    syncERC20Transfers({ announcementChainId, chainIds }),
    checkAddressBalances({ chainIds }),
    // announceStealthAccounts(),
    scanStealthAddresses(),
  ]);
};

export default sync;
