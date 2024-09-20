import 'dotenv/config';
import syncUserOps from './syncUserOps';
import syncIncomingTransfers from './syncIncomingTransfers';
import syncOutgoingTransfers from './syncOutgoingTransfers';

const sync = async () => {
  await Promise.all([
    syncUserOps(),
    syncIncomingTransfers(),
    syncOutgoingTransfers(),
  ]);
};

sync();
