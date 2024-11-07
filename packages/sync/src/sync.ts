import syncBlocks from './manageReorgs';
import syncNativeTransfers from './syncNativeTransfers';
import syncERC20Transfers from './syncERC20Transfers';
import syncAnnouncements from './syncAnnouncements';
import scanStealthAddresses from './scanStealthAddresses';
// import { announceStealthAccounts } from './announceStealthAccounts';
import checkAddressBalances from './checkAddressBalances';
import assignNativeTransfers from './assignNativeTransfers';
import syncUserOps from './syncUserOps';
import { base } from 'viem/chains';

/**
 * We use Base to make ERC5564 announcements
 */
const ERC5564_DEFAULT_ANNOUNCEMENT_CHAIN_ID = base.id;

const sync = async ({ chainIds }: { chainIds: number[] }) => {
  await Promise.all([
    syncBlocks({ chainIds }),
    syncUserOps({ chainIds }),
    syncNativeTransfers({ chainIds }),
    syncAnnouncements({ chainId: ERC5564_DEFAULT_ANNOUNCEMENT_CHAIN_ID }),
    assignNativeTransfers(),
    syncERC20Transfers({ chainIds }),
    checkAddressBalances({ chainIds }),
    // announceStealthAccounts(),
    scanStealthAddresses(),
  ]);
};

export default sync;
