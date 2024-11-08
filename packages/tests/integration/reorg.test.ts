import { beforeAll, describe, expect, test } from 'vitest';
import {
  createStealthAccountForTestUser,
  fundAddress,
  getTestClient,
} from '../lib/utils';
import { Address, Hex, parseEther, zeroAddress } from 'viem';
import { sync } from '@raylac/sync';
import { anvil } from 'viem/chains';
import { getAuthedClient } from '../lib/rpc';
import {
  buildUserOp,
  encodePaymasterAndData,
  getGasInfo,
  getSpendingPrivKey,
  getViewingPrivKey,
  RAYLAC_PAYMASTER_V2_ADDRESS,
  signUserOpWithStealthAccount,
  sleep,
} from '@raylac/shared';
import { TEST_ACCOUNT_MNEMONIC } from '../lib/auth';

const testClient = getTestClient();

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
  const timeout = Date.now() + 20000;

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
    // Fund the sender address
    await fundAddress({ address: sender, amount: parseEther('1') });
  });

  test('should handle a reorg for incoming transfers correctly', async () => {
    const authedClient = await getAuthedClient();

    // Start the sync job for Anvil
    await sync({
      announcementChainId: anvil.id,
      chainIds: [anvil.id],
    });

    const snapshot = await testClient.snapshot();

    // Create a stealth address for the test user
    const stealthAccount = await createStealthAccountForTestUser({
      useAnvil: true,
    });

    // Fund the stealth account
    await testClient.setBalance({
      address: stealthAccount.address,
      value: parseEther('1'),
    });

    await testClient.mine({ blocks: 1 });

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

    await testClient.mine({ blocks: 5 });

    expect(await isTxRemoved(txHash)).toBe(true);
    expect(
      await getSynchedAddressNonce({ address: stealthAccount.address })
    ).toBe(undefined);

    const balances = await authedClient.getAddressBalancesPerChain.query();

    expect(balances[stealthAccount.address]).toBe(undefined);
  });
});
