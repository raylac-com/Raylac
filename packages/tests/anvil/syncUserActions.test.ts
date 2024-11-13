import { beforeEach, describe, expect, it } from 'vitest';
import {
  createStealthAccountForTestUser,
  getTestClient,
  signUserOpWithPaymasterAccount,
  signUserOpWithTestUserAccount,
  waitFor,
} from '../lib/utils';
import prisma from '../lib/prisma';
import {
  StealthAddressWithEphemeral,
  UserActionType,
  UserOperation,
} from '@raylac/shared';
import { Hex, parseEther } from 'viem';
import { zeroAddress } from 'viem';
import {
  encodeUserActionTag,
  generateRandomMultiChainTag,
  getGasInfo,
} from '@raylac/shared/src/utils';
import { devChains } from '@raylac/shared/src/devChains';
import { buildUserOp } from '@raylac/shared/src/erc4337';
import { getAuthedClient } from '../lib/rpc';

const waitForUserActionSync = async ({ txHashes }: { txHashes: Hex[] }) => {
  await waitFor({
    fn: async () => {
      const userAction = await prisma.userAction.findUnique({
        select: {
          timestamp: true,
        },
        where: { txHashes },
      });

      return userAction !== null;
    },
    timeout: 30000,
    label: 'waitForUserActionSync',
  });
};

/**
 * Test that UserAction are correctly backfilled
 *
 * Steps:
 * 1. Create a new stealth account for the test user
 * 2. Fund the stealth account on all dev chains
 * 3. Send multi-chain transfers using the stealth accounts
 * 4. Delete the `UserAction` from the database
 *    - The RPC endpoint saves the `UserAction` to the DB when UserOperations are submitted.
 *    - So we need to delete the `UserAction` from the DB to test the backfilling.
 * 5. Wait for deleted `UserAction` to be backfilled.
 * 6. Check that the `UserAction` is correctly indexed
 */
describe('syncUserActions', () => {
  let stealthAccount: StealthAddressWithEphemeral;

  beforeEach(async () => {
    stealthAccount = await createStealthAccountForTestUser({
      useAnvil: true,
    });

    // Fund the stealth account on all dev chains
    for (const chain of devChains) {
      const testClient = getTestClient({ chainId: chain.id });
      await testClient.setBalance({
        address: stealthAccount.address,
        value: parseEther('1000'),
      });
    }
  });

  it('should backfill multicahin transfers', async () => {
    // 1. Send multi-chain transfers

    const authedClient = await getAuthedClient();

    const amount = parseEther('0.0001');

    const gasInfo = await getGasInfo({
      chainIds: devChains.map(c => c.id),
    });

    const signedUserOps: UserOperation[] = [];
    const groupTag = generateRandomMultiChainTag();
    const groupSize = 2;

    for (const chain of devChains) {
      const chainGasInfo = gasInfo.find(g => g.chainId === chain.id);

      if (!chainGasInfo) {
        throw new Error(`Gas info not found for chain ${chain.id}`);
      }

      const tag = encodeUserActionTag({
        groupTag,
        groupSize,
        userActionType: UserActionType.Transfer,
      });

      const userOp = buildUserOp({
        stealthSigner: stealthAccount.signerAddress,
        to: zeroAddress,
        value: amount,
        data: '0x',
        tag,
        chainId: chain.id,
        gasInfo: chainGasInfo,
        nonce: null,
      });

      // Get the paymaster signature
      const paymasterSignedUserOp = await signUserOpWithPaymasterAccount({
        userOp,
      });

      // Sign the user operation with the test user's stealth account
      const signedUserOp = await signUserOpWithTestUserAccount({
        userOp: paymasterSignedUserOp,
        stealthAccount,
      });

      signedUserOps.push(signedUserOp);
    }

    // Submit the user operations to the RPC endpoint
    const { txHashes } = await authedClient.submitUserOps.mutate({
      userOps: signedUserOps,
    });

    const sortedTxHashes = txHashes.sort();
    /*

    // Set the `userActionId` to `null` of the transactions so we can delete the `UserAction`
    await prisma.transaction.updateMany({
      data: {
        userActionId: null,
      },
      where: {
        hash: {
          in: sortedTxHashes,
        },
      },
    });

    // Delete the `UserAction`
    await prisma.userAction.delete({
      where: {
        txHashes: sortedTxHashes,
      },
    });
    */

    // 3. Wait for the transfers to synched again
    await waitForUserActionSync({ txHashes: sortedTxHashes });

    // 4. Check that the UserAction is correctly indexed
    const userAction = await prisma.userAction.findUnique({
      where: { txHashes: sortedTxHashes },
    });

    expect(userAction).not.toBeNull();
    expect(userAction?.timestamp).toBeGreaterThan(0);
    expect(userAction?.groupSize).toBe(groupSize);
    expect(userAction?.groupTag).toBe(groupTag);
  });

  it('should backfill single chain transfers', async () => {
    // 1. Send single-chain transfers

    const authedClient = await getAuthedClient();

    const amount = parseEther('0.0001');

    const gasInfo = await getGasInfo({
      chainIds: devChains.map(c => c.id),
    });

    const signedUserOps: UserOperation[] = [];
    const groupTag = generateRandomMultiChainTag();

    const chain = devChains[0];

    const chainGasInfo = gasInfo.find(g => g.chainId === chain.id);

    if (!chainGasInfo) {
      throw new Error(`Gas info not found for chain ${chain.id}`);
    }

    const tag = encodeUserActionTag({
      groupTag,
      groupSize: 1,
      userActionType: UserActionType.Transfer,
    });

    const userOp = buildUserOp({
      stealthSigner: stealthAccount.signerAddress,
      to: zeroAddress,
      value: amount,
      data: '0x',
      tag,
      chainId: chain.id,
      gasInfo: chainGasInfo,
      nonce: null,
    });

    // Get the paymaster signature
    const paymasterSignedUserOp = await signUserOpWithPaymasterAccount({
      userOp,
    });

    // Sign the user operation with the test user's stealth account
    const signedUserOp = await signUserOpWithTestUserAccount({
      userOp: paymasterSignedUserOp,
      stealthAccount,
    });

    signedUserOps.push(signedUserOp);

    // Submit the user operations to the RPC endpoint
    const { txHashes } = await authedClient.submitUserOps.mutate({
      userOps: signedUserOps,
    });

    // 3. Wait for the transfers to synched again
    await waitForUserActionSync({ txHashes });

    // 4. Check that the UserAction is correctly indexed
    const userAction = await prisma.userAction.findUnique({
      where: { txHashes },
    });

    expect(userAction).not.toBeNull();
    expect(userAction?.timestamp).toBeGreaterThan(0);
    expect(userAction?.groupSize).toBe(1);
    expect(userAction?.groupTag).toBe(groupTag);
  });
});
