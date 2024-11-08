import 'dotenv/config';
import {
  ACCOUNT_FACTORY_V2_ADDRESS,
  ACCOUNT_IMPL_V2_ADDRESS,
  ENTRY_POINT_ADDRESS,
  getPublicClient,
  getSpendingPrivKey,
  getViewingPrivKey,
  getWalletClient,
  RAYLAC_PAYMASTER_V2_ADDRESS,
  RaylacPaymasterAbi,
  sleep,
} from '@raylac/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { client, getAuthedClient } from './lib/rpc';
import { TEST_ACCOUNT_MNEMONIC } from './lib/auth';
import { getTestClient } from './lib/utils';
import {
  ACCOUNT_FACTORY_V2_BYTECODE,
  ACCOUNT_IMPL_V2_BYTECODE,
  ENTRYPOINT_BYTECODE,
  RAYLAC_PAYMASTER_BYTECODE,
  SENDER_CREATOR_BYTECODE,
} from './lib/bytecode';
import { parseEther } from 'viem';
import { anvil } from 'viem/chains';

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

const SENDER_CREATOR_ADDRESS = '0x7fc98430eaedbb6070b35b39d798725049088348';

const BUNDLER_ADDRESS = '0x9D3224743435d058f4B17Da29E8673DceD1768E7';

const ANNOUNCER_ADDRESS = '0x44B31836e77E74b2dA2E5B81967BB17e5b69ED5A';

const initAnvilState = async () => {
  const testClient = getTestClient();

  const authedClient = await getAuthedClient();

  await authedClient.pruneAnvil.mutate();

  // Deploy the EntryPoint contract
  await testClient.setCode({
    address: ENTRY_POINT_ADDRESS,
    bytecode: ENTRYPOINT_BYTECODE,
  });

  // Deploy the SenderCreator contract
  await testClient.setCode({
    address: SENDER_CREATOR_ADDRESS,
    bytecode: SENDER_CREATOR_BYTECODE,
  });

  // Deploy the RaylacPaymaster contract
  await testClient.setCode({
    address: RAYLAC_PAYMASTER_V2_ADDRESS,
    bytecode: RAYLAC_PAYMASTER_BYTECODE,
  });

  // Deploy the AccountFactory contract
  await testClient.setCode({
    address: ACCOUNT_FACTORY_V2_ADDRESS,
    bytecode: ACCOUNT_FACTORY_V2_BYTECODE,
  });

  // Deploy the Account contract
  await testClient.setCode({
    address: ACCOUNT_IMPL_V2_ADDRESS,
    bytecode: ACCOUNT_IMPL_V2_BYTECODE,
  });

  // Deposit funds to the EntryPoint

  const walletClient = getWalletClient({ chainId: anvil.id });

  // Fund the bundler
  await testClient.setBalance({
    address: BUNDLER_ADDRESS,
    value: parseEther('1'),
  });

  // Fund the announcer
  await testClient.setBalance({
    address: ANNOUNCER_ADDRESS,
    value: parseEther('1'),
  });

  const publicClient = getPublicClient({ chainId: anvil.id });

  // Deposit funds to the paymaster
  await testClient.impersonateAccount({ address: ANNOUNCER_ADDRESS });
  await walletClient.writeContract({
    account: ANNOUNCER_ADDRESS,
    address: RAYLAC_PAYMASTER_V2_ADDRESS,
    abi: RaylacPaymasterAbi,
    functionName: 'deposit',
    value: parseEther('0.1'),
  });

  // Sanity check the deposit
  const deposit = await publicClient.readContract({
    address: RAYLAC_PAYMASTER_V2_ADDRESS,
    abi: RaylacPaymasterAbi,
    functionName: 'getDeposit',
  });

  if (deposit < parseEther('0.1')) {
    throw new Error('Deposit failed');
  }
};

const setup = async () => {
  // eslint-disable-next-line no-console
  console.log(`RPC_URL ${process.env.RPC_URL}`);
  // eslint-disable-next-line no-console
  console.log(`ANVIL_RPC_URL ${process.env.ANVIL_RPC_URL}`);

  // Wait for the server to get ready
  await waitForServer();

  const users = await client.getUsers.query();

  const testUserExists = users.find(
    user => user.username === TEST_USER_USERNAME
  );

  if (!testUserExists) {
    await signUpTestUser();
  }

  await initAnvilState();
};

await setup();
