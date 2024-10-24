import 'dotenv/config';
import syncUserOps from './syncUserOps';
import syncBlocks from './syncBlocks';
import syncNativeTransfers from './syncNativeTransfers';
import syncERC20Transfers from './syncERC20Transfers';
import syncAnnouncements from './syncAnnouncements';
import scanStealthAddresses from './scanStealthAddresses';
// import { announceStealthAccounts } from './announceStealthAccounts';
import checkAddressBalances from './checkAddressBalances';
import syncTxLogs from './syncTxLogs';
import syncUpgrades from './syncUpgrades';

const sync = async () => {
  await Promise.all([
    syncBlocks(),
    syncUserOps(),
    syncNativeTransfers(),
    syncERC20Transfers(),
    checkAddressBalances(),
    // announceStealthAccounts(),
    syncAnnouncements(),
    scanStealthAddresses(),
    syncUpgrades(),
    syncTxLogs(),
  ]);
};

sync();
