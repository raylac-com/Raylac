import { client } from './rpc';

const test = async () => {
  const version = await client.version.query();
  console.log(version);
};

test();
