import 'dotenv/config';
import syncUserOps from './syncUserOps';
import syncBlocks from './syncBlocks';
import syncIncomingNativeTransfers from './syncIncomingTransfers';
import syncIncomingERC20Transfers from './syncIncomingERC20Transfers';
import syncAnnouncements from './syncAnnouncements';
import scanStealthAddresses from './scanStealthAddresses';
// import { announceStealthAccounts } from './announceStealthAccounts';

const sync = async () => {
  await Promise.all([
    syncBlocks(),
    syncUserOps(),
    syncIncomingNativeTransfers(),
    syncIncomingERC20Transfers(),
    // announceStealthAccounts(),
    syncAnnouncements(),
    scanStealthAddresses(),
  ]);
};

sync();
