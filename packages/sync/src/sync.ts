import 'dotenv/config';
import syncUserOps from './syncUserOps';
import syncBlocks from './syncBlocks';
import syncNativeTransfers from './syncNativeTransfers';
import syncERC20Transfers from './syncERC20Transfers';
import syncAnnouncements from './syncAnnouncements';
import scanStealthAddresses from './scanStealthAddresses';
import { announceStealthAccounts } from './announceStealthAccounts';

const sync = async () => {
  await Promise.all([
    syncBlocks(),
    syncUserOps(),
    syncNativeTransfers(),
    syncERC20Transfers(),
    announceStealthAccounts(),
    syncAnnouncements(),
    scanStealthAddresses(),
  ]);
};

sync();
