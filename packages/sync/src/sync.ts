import syncBlocks from './manageReorgs';
import syncNativeTransfers from './syncNativeTransfers';
import syncERC20Transfers from './syncERC20Transfers';
import syncAnnouncements from './syncAnnouncements';
import scanStealthAddresses from './scanStealthAddresses';
// import { announceStealthAccounts } from './announceStealthAccounts';
import checkAddressBalances from './checkAddressBalances';
import assignNativeTransfers from './assignNativeTransfers';
import syncUserOps from './syncUserOps';

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
