import syncBlocks from './manageReorgs';
import syncNativeTransfers from './syncNativeTransfers';
import syncERC20Transfers from './syncERC20Transfers';
import syncAnnouncements from './syncAnnouncements';
import scanStealthAddresses from './scanStealthAddresses';
// import { announceStealthAccounts } from './announceStealthAccounts';
import checkAddressBalances from './checkAddressBalances';
import assignNativeTransfers from './assignNativeTransfers';
import syncUserOps from './syncUserOps';

const sync = async ({ chainIds }: { chainIds: number[] }) => {
  await Promise.all([
    syncBlocks({ chainIds }),
    syncUserOps({ chainIds }),
    syncNativeTransfers({ chainIds }),
    syncAnnouncements({ chainIds }),
    assignNativeTransfers({ chainIds }),
    syncERC20Transfers({ chainIds }),
    checkAddressBalances({ chainIds }),
    // announceStealthAccounts(),
    scanStealthAddresses(),
  ]);
};

export default sync;
