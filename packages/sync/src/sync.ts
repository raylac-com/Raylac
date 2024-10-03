import 'dotenv/config';
import syncUserOps from './syncUserOps';
import syncIncomingTransfers from './syncIncomingTransfers';
import syncOutgoingTransfers from './syncOutgoingTransfers';
import syncBlocks from './syncBlocks';
// import syncERC20Transfers from './syncERC20Transfers';

const sync = async () => {
  await Promise.all([
    syncBlocks(),
    syncUserOps(),
    syncIncomingTransfers(),
    //    syncERC20Transfers(),
    syncOutgoingTransfers(),
  ]);
};

sync();
