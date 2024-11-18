import 'dotenv/config';
import {
  ACCOUNT_FACTORY_V2_ADDRESS,
  ACCOUNT_IMPL_V2_ADDRESS,
  devChains,
  ENTRY_POINT_ADDRESS,
  ERC5564_ANNOUNCER_ADDRESS,
  getChainName,
  getPublicClient,
  getSpendingPrivKey,
  getViewingPrivKey,
  getWalletClient,
  RAYLAC_PAYMASTER_V2_ADDRESS,
  RaylacPaymasterAbi,
} from '@raylac/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { client, getAuthedClient } from './lib/rpc';
import { TEST_ACCOUNT_MNEMONIC } from './lib/auth';
import { getTestClient, waitFor } from './lib/utils';
import {
  ACCOUNT_FACTORY_V2_BYTECODE,
  ACCOUNT_IMPL_V2_BYTECODE,
  ENTRYPOINT_BYTECODE,
  ERC5564_ANNOUNCER_BYTECODE,
  RAYLAC_PAYMASTER_BYTECODE,
  SENDER_CREATOR_BYTECODE,
} from './lib/bytecode';
import { parseEther } from 'viem';
import { logger } from '../shared-backend/out';
import { spawn } from 'child_process';

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

/**
 * Wait for the RPC server and the database to be ready
 */
const waitForRpcServer = async () => {
  await waitFor({
    interval: 1000,
    timeout: 10 * 60 * 1000, // 10 minutes
    label: 'waiting for RPC server',
    fn: async () => {
      // Git commit to test against
      const GIT_COMMIT = process.env.GIT_COMMIT || '';

      try {
        const gitCommit = await client.getGitCommit.query();
        // eslint-disable-next-line no-console
        console.log(`waiting for RPC server: ${gitCommit} === ${GIT_COMMIT}`);

        return gitCommit === GIT_COMMIT;
      } catch (_e: any) {
        logger.info('RPC server not ready yet, waiting...');
        return false;
      }
    },
  });
};

/**
 * Wait for the indexer to get ready
 */
const waitForIndexer = async () => {
  const INDEXER_URL = process.env.INDEXER_URL;

  if (!INDEXER_URL) {
    throw new Error('INDEXER_URL not found');
  }

  await waitFor({
    interval: 1000,
    timeout: 10 * 60 * 1000, // 10 minutes
    label: 'waiting for indexer',
    fn: async () => {
      // Git commit to test against
      const GIT_COMMIT = process.env.GIT_COMMIT || '';

      try {
        const result = await fetch(`${INDEXER_URL}/git-commit`);
        const gitCommit = await result.text();

        // eslint-disable-next-line no-console
        console.log(`waiting for indexer: ${gitCommit} === ${GIT_COMMIT}`);

        return gitCommit === GIT_COMMIT;
      } catch (_e: any) {
        logger.info('Indexer not ready yet, waiting...');
        return false;
      }
    },
  });
};

const SENDER_CREATOR_ADDRESS = '0x7fc98430eaedbb6070b35b39d798725049088348';

const BUNDLER_ADDRESS = '0x9D3224743435d058f4B17Da29E8673DceD1768E7';

const ANNOUNCER_ADDRESS = '0x44B31836e77E74b2dA2E5B81967BB17e5b69ED5A';

const initDevChainState = async ({ chainId }: { chainId: number }) => {
  logger.info(`Initializing state for ${getChainName(chainId)}`);
  const testClient = getTestClient({ chainId });

  /*
  // Load the genesis state
  // This is the state where everything is empty
  await testClient.loadState({
    state:
      '0x1f8b08000000000000ffed56cd8e1b370c7e9739e7a03fea678f41d1f4d04351a0a722302892da1dd4f6189ed9628385dfbd94ed6cbb0b236890b904880c181a4ae4474ad4473e0f753bd15fc3ddf3b07fdc55390e77837932c3bb81a6715f71968be07f0ed55bc69dcc0bee0e6745ab927b9c37db71372e170915f2b9efecd69b5c005cb25dc4636b233d6e974f2f7e1c8ef2f711f78cd35779f2050f35e2ba91279279de74dfd4f8e6701c49fa295ce5e73dba38dc99ab827e5c37d9d3e9dd8044d3e37e99bb8e061598522931303a32b93a1f4bae9e3d5122f4ce16cfa5009ccf79da772bdd2e6ef13cef0760c51631542a56173ebb4a135f96753e2fd311efbb931d5f31817d406c105c4c5c1327f231655f54962c1aa3ae448cab626a5c364bb6e21b10b7a4e0e43982ce2a19ac0daa1acd6d4d4c4f211033d788c59886ae42066657d48c67eb1a06577ca535318340a921e490aa4f0552869c8b338429b7da5c24534381f805cc5708a97ddbd040a3b151fdcefaef4c763e65e3213b9d8506d958b0108defaedaec1a43cdba0b1c98fe53e5a0dad4fc8d589329259564086cb68ec9a3b186121b5bc188619b7a6e535ef37c8b69a9d416a53a0a2d278d0f444fb96427b65963456fb498b82a668a8229181725b9081034a320358490a2c7caa6478e5856c52c0a64125b04a8442e1620c8156d6c9a589c6da906953bd6c4442392d006c7ca0b649b92820d1230b704519f8b33a8d7edcc9a98cd97c651c02272ce2db64012b1e6ec92d3dcd114aec5b9b8da7d2a68d52ab33917afcd9bca75162a31fff93c3c08725f791e0e7894fdf20bce0f6b959169b793e3fc62d1325160c92c9480136af45021a61a893858646f5d005b4bc89a85d637d3efa871301c8a0fa93b2e7bd1f237e2f1d3d7565dadb88bfc3e4dcb5ad12d5a7367a4659cf6f38b5d88cafdcd26abb90c80b1b5ec03482c5af45ad6fbaf218bf286a63d219351ce72ae55101f7d0dae37034721190fcbbca6afdbe97e7ebf9da6dd2a067f8cef7bdc6e23df70847673bfde684955fcc72cfcb2ed75331b9337dea6a20bbbf1694d2eb972e20d63d73ef96791dfe4f8a137a4ff76cbbd2ffdf0c6e34bfffafeb2f21fa9bee79f70c10b999e5ebf6fa5ca8f9ff9accf4f1f6fad3f8c9d8147c2ede6cc362ade3f6eb7a77f0006052705430c0000',
  });
  */

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

  // Deploy the ERC5564Announcer contract
  await testClient.setCode({
    address: ERC5564_ANNOUNCER_ADDRESS,
    bytecode: ERC5564_ANNOUNCER_BYTECODE,
  });

  // Deposit funds to the EntryPoint

  const walletClient = getWalletClient({ chainId });

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

  const publicClient = getPublicClient({ chainId });

  // Deposit funds to the paymaster
  await testClient.impersonateAccount({ address: ANNOUNCER_ADDRESS });
  await walletClient.writeContract({
    account: ANNOUNCER_ADDRESS,
    address: RAYLAC_PAYMASTER_V2_ADDRESS,
    abi: RaylacPaymasterAbi,
    functionName: 'deposit',
    value: parseEther('0.1'),
  });
  await testClient.stopImpersonatingAccount({
    address: ANNOUNCER_ADDRESS,
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

/**
 * Spawn an anvil instance as a child process.
 * *NOTE: This function doesn't throw even if the anvil process is already running and the port is already in use. The caller
 * * should use the existing anvil instance if it exists.
 */
const startAnvil = ({ port, chainId }: { port: number; chainId: number }) => {
  const anvil = spawn(
    'anvil',
    [
      '--base-fee',
      '10000',
      '--port',
      port.toString(),
      '--chain-id',
      chainId.toString(),
    ],
    {
      detached: false, // The child process is not detached from the parent
    }
  );

  // Listen for the process's output (optional if stdio is not 'inherit')
  anvil.stdout.on('data', data => {
    logger.debug(`anvil: ${data}`);
  });

  anvil.stderr.on('error', data => {
    logger.error(`anvil error: ${data}`);
  });

  // Handle process exit
  anvil.on('close', code => {
    logger.info(`anvil exited with code ${code}`);
  });
};

const setup = async () => {
  for (const chain of devChains) {
    startAnvil({ port: chain.port, chainId: chain.id });
  }

  logger.info(`RPC_URL ${process.env.RPC_URL}`);

  // Wait for the RPC server and the indexer to get ready
  await Promise.all([waitForRpcServer(), waitForIndexer()]);

  const users = await client.getUsers.query();

  const testUserExists = users.find(
    user => user.username === TEST_USER_USERNAME
  );

  // Create the test user if it doesn't yet exist on the server we're testing against
  if (!testUserExists) {
    await signUpTestUser();
  }

  // Initialize the state for all dev chains
  await Promise.all(
    devChains.map(chain => initDevChainState({ chainId: chain.id }))
  );
};

await setup();
