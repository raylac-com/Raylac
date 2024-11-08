import { beforeAll, describe, expect, test } from 'vitest';
import {
  createStealthAccountForTestUser,
  fundAddress,
  getTestClient,
  impersonateAndSend,
} from '../lib/utils';
import { Address, Hex, parseEther, zeroAddress } from 'viem';
import { sync } from '@raylac/sync';
import { anvil } from 'viem/chains';
import { getAuthedClient } from '../lib/rpc';
import {
  buildUserOp,
  encodePaymasterAndData,
  ENTRY_POINT_ADDRESS,
  getGasInfo,
  getSpendingPrivKey,
  getViewingPrivKey,
  RAYLAC_PAYMASTER_V2_ADDRESS,
  signUserOpWithStealthAccount,
  sleep,
} from '@raylac/shared';
import { ENTRYPOINT_BYTECODE, SENDER_CREATOR_BYTECODE } from '../lib/bytecode';
import { TEST_ACCOUNT_MNEMONIC } from '../lib/auth';

const testClient = getTestClient();

const SENDER_CREATOR_ADDRESS = '0x7fc98430eaedbb6070b35b39d798725049088348';

/*
const waitForIncomingSync = async (txHash: Hex) => {
  const timeout = setTimeout(() => {
    throw new Error('Timeout waiting for incoming sync');
  }, 10000);

  while (true) {
    const authedClient = await getAuthedClient();

    const transferHistory = await authedClient.getTransferHistory.query({
      take: 1,
      includeAnvil: true,
    });

    if (transferHistory.length === 0) {
      await sleep(3000);
      continue;
    }

    if (transferHistory[0].hash === txHash) {
      clearTimeout(timeout);
      return;
    }

    await sleep(3000);
  }
};
*/

const isTxRemoved = async (txHash: Hex) => {
  const timeout = Date.now() + 10000;

  const authedClient = await getAuthedClient();

  while (true) {
    const transferDetails = await authedClient.getTransferDetails.query({
      txHash,
    });

    if (!transferDetails.hash) {
      return true;
    }

    if (Date.now() > timeout) {
      return false;
    }

    await sleep(3000);
  }
};

export const getSynchedAddressNonce = async ({
  address,
}: {
  address: Address;
}) => {
  const authedClient = await getAuthedClient();

  const addressNonces = await authedClient.getAddressNonces.query();

  // eslint-disable-next-line security/detect-object-injection
  return addressNonces[address];
};

describe('reorg', () => {
  const sender = zeroAddress;
  beforeAll(async () => {
    const authedClient = await getAuthedClient();

    await authedClient.pruneAnvil.mutate();

    // Fund the sender address
    await fundAddress({ address: sender, amount: parseEther('1') });

    // Fund the bundler
    await impersonateAndSend({
      from: sender,
      to: '0x9D3224743435d058f4B17Da29E8673DceD1768E7',
      amount: parseEther('0.3'),
    });

    await testClient.setCode({
      address: ENTRY_POINT_ADDRESS,
      bytecode: ENTRYPOINT_BYTECODE,
    });

    await testClient.setCode({
      address: SENDER_CREATOR_ADDRESS,
      bytecode: SENDER_CREATOR_BYTECODE,
    });
  });

  test('should handle a reorg for incoming transfers correctly', async () => {
    const authedClient = await getAuthedClient();

    // Start the sync job for Anvil
    sync({ chainIds: [anvil.id] });

    const snapshot = await testClient.snapshot();

    // Create a stealth address for the test user
    const stealthAccount = await createStealthAccountForTestUser();

    // Send a transaction
    await impersonateAndSend({
      from: sender,
      to: stealthAccount.address,
      amount: parseEther('0.1'),
    });

    await testClient.mine({ blocks: 1 });

    // Wait for the transfer to be synced
    // await waitForIncomingSync(depositTxHash);

    const gasInfo = await getGasInfo({
      chainIds: [anvil.id],
    });

    const userOp = buildUserOp({
      stealthSigner: stealthAccount.signerAddress,
      to: zeroAddress,
      value: parseEther('0.001'),
      data: '0x',
      tag: '0x',
      chainId: anvil.id,
      gasInfo,
      nonce: null,
    });

    // Get the paymaster signature
    const paymasterAndData = encodePaymasterAndData({
      paymaster: RAYLAC_PAYMASTER_V2_ADDRESS,
      data: await authedClient.paymasterSignUserOp.mutate({ userOp }),
    });
    userOp.paymasterAndData = paymasterAndData;

    const spendingPrivKey = getSpendingPrivKey(TEST_ACCOUNT_MNEMONIC);
    const viewingPrivKey = getViewingPrivKey(TEST_ACCOUNT_MNEMONIC);

    // Sign the user operation with the stealth account
    const signedUserOp = await signUserOpWithStealthAccount({
      userOp,
      stealthAccount,
      spendingPrivKey,
      viewingPrivKey,
    });

    const txHash = await authedClient.submitUserOps.mutate({
      userOps: [signedUserOp],
    });

    // Reorg the chain
    await testClient.revert({ id: snapshot });

    await testClient.mine({ blocks: 3 });

    expect(await isTxRemoved(txHash)).toBe(true);
    expect(
      await getSynchedAddressNonce({ address: stealthAccount.address })
    ).toBe(undefined);

    const balances = await authedClient.getAddressBalancesPerChain.query();

    const addressBalance = balances.find(
      balance => balance.address === stealthAccount.address
    );

    expect(addressBalance).toBe(undefined);
  });
});
