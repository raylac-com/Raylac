import 'dotenv/config';
import syncAnnouncements from './syncAnnouncements';

const sync = async () => {
  await syncAnnouncements();
};

sync();
