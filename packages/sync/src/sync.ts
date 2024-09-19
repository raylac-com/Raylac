import 'dotenv/config';
// import syncAnnouncements from './syncAnnouncements';
import syncUserOps from './syncUserOps';
import syncTransfers from './syncTransfers';
import syncTransactionTraces from './syncTransactions';

const sync = async () => {
  // await syncAnnouncements();
  await Promise.all([syncUserOps(), syncTransfers(), syncTransactionTraces()]);
};

sync();
