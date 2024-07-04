import 'dotenv/config';
import syncAnnouncements from './syncAnnouncements';
import syncUserOps from './syncUserOps';

const sync = async () => {
  await syncAnnouncements();
  await syncUserOps();
};

sync();
