import 'dotenv/config';
import { getSpendingPrivKey, getViewingPrivKey, sleep } from '@raylac/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { client } from './lib/rpc';
import { TEST_ACCOUNT_MNEMONIC } from './lib/auth';

const TEST_USER_NAME = 'Test User';
const TEST_USER_USERNAME = 'testuser';

const signUpTestUser = async () => {
  const spendingPubKey = privateKeyToAccount(
    getSpendingPrivKey(TEST_ACCOUNT_MNEMONIC)
  ).publicKey;
  const viewingPrivKey = getViewingPrivKey(TEST_ACCOUNT_MNEMONIC);

  try {
    const { token: _token } = await client.signUp.mutate({
      name: TEST_USER_NAME,
      username: TEST_USER_USERNAME,
      spendingPubKey,
      viewingPrivKey,
    });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.log(e.message);
  }
};

const waitForServer = async () => {
  while (true) {
    try {
      await client.getUsers.query();
      break;
    } catch (_e: any) {
      // eslint-disable-next-line no-console
      console.log(`Server not ready yet, waiting...`);
    }

    await sleep(5000);
  }
};

const setup = async () => {
  // eslint-disable-next-line no-console
  console.log(`Testing RPC_URL ${process.env.RPC_URL}`);

  // Wait for the server to get ready
  await waitForServer();

  const users = await client.getUsers.query();

  const testUserExists = users.find(
    user => user.username === TEST_USER_USERNAME
  );

  if (!testUserExists) {
    await signUpTestUser();
  }
};

await setup();
