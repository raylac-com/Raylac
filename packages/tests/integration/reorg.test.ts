import { beforeAll, describe, expect, test } from 'vitest';
import {
  createStealthAccountForTestUser,
  getTestClient,
  waitFor,
} from '../lib/utils';
import { parseEther, zeroAddress } from 'viem';
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
} from '@raylac/shared';
import { TEST_ACCOUNT_MNEMONIC } from '../lib/auth';
import prisma from '../lib/prisma';

const testClient = getTestClient({ chainId: anvil.id });

const isTransferRemoved = async ({ transferId }: { transferId: number }) => {
  await waitFor({
    fn: async () => {
      const transfer = await prisma.userAction.findUnique({
        where: { id: transferId },
      });

      const txs = await prisma.transaction.findMany({
        where: { userActionId: transferId },
      });

      // `Transaction` and `UserAction` must be both deleted.
      if (transfer && txs.length === 0) {
        // eslint-disable-next-line no-console
        console.error(`Transactions removed but UserAction ${transferId} not`);
        return true;
      }

      if (!transfer && txs.length > 0) {
        // eslint-disable-next-line no-console
        console.error(`UserAction ${transferId} removed but transactions not`);
        return true;
      }

      if (!transfer && txs.length === 0) {
        return true;
      }

      return false;
    },
    timeout: 20000,
    label: 'isTransferRemoved',
  });
};

describe('reorg', () => {
  const sender = zeroAddress;
  beforeAll(async () => {
    // Fund the sender address
    await testClient.setBalance({
      address: sender,
      value: parseEther('1'),
    });
  });

  test('should handle a reorg for incoming transfers correctly', async () => {
    const authedClient = await getAuthedClient();

    const snapshot = await testClient.snapshot();

    // Create a stealth address for the test user
    const stealthAccount = await createStealthAccountForTestUser({
      syncOnChainIds: [anvil.id],
      announcementChainId: anvil.id,
    });

    // Fund the stealth account
    await testClient.setBalance({
      address: stealthAccount.address,
      value: parseEther('1'),
    });

    await testClient.mine({ blocks: 1 });

    const [gasInfo] = await getGasInfo({
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

    const { transferId } = await authedClient.submitUserOps.mutate({
      userOps: [signedUserOp],
      tokenPrice: 1, // dummy value
    });

    // Reorg the chain
    await testClient.revert({ id: snapshot });

    await testClient.mine({ blocks: 5 });

    expect(await isTransferRemoved({ transferId })).toBe(true);

    const balances = await authedClient.getAddressBalancesPerChain.query();

    const addressBalance = balances.find(
      balance => balance.address === stealthAccount.address
    );

    expect(addressBalance).toBe(undefined);
  });
});
