import syncBlocks from './manageReorgs';
import syncNativeTransfers from './syncNativeTransfers';
import syncERC20Transfers from './syncERC20Transfers';
import syncAnnouncements from './syncAnnouncements';
import scanStealthAddresses from './scanStealthAddresses';
// import { announceStealthAccounts } from './announceStealthAccounts';
import checkAddressBalances from './checkAddressBalances';
import assignNativeTransfers from './assignNativeTransfers';
import syncUserOps from './syncUserOps';
// import syncTxLogs from './syncTxLogs';

const sync = async () => {
  await Promise.all([
    syncBlocks(),
    syncUserOps(),
    syncNativeTransfers(),
    syncAnnouncements(),
    assignNativeTransfers(),
    syncERC20Transfers(),
    checkAddressBalances(),
    // announceStealthAccounts(),
    scanStealthAddresses(),
    // syncTxLogs(),
  ]);
};

sync();
