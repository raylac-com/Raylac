import { beforeAll, describe, expect, it } from 'vitest';
import {
  createStealthAccountForTestUser,
  getTestClient,
  getUserActionTag,
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
import { Hex, pad, parseEther } from 'viem';
import { zeroAddress } from 'viem';
import { getGasInfo } from '@raylac/shared/src/utils';
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
    timeout: 10000,
    label: 'waitForUserActionSync',
  });
};

describe('syncMultichainTransfers', () => {
  let stealthAccount: StealthAddressWithEphemeral;
  beforeAll(async () => {
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
    const groupTag = pad('0x3333', { size: 32 });
    const groupSize = 2;
    for (const chain of devChains) {
      const chainGasInfo = gasInfo.find(g => g.chainId === chain.id);

      if (!chainGasInfo) {
        throw new Error(`Gas info not found for chain ${chain.id}`);
      }

      const tag = getUserActionTag({
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
    const txHashes = await authedClient.submitUserOps.mutate({
      userOps: signedUserOps,
    });

    const sortedTxHashes = txHashes.sort();

    // 2. Modify the UserAction in the database to a wrong value
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

    await prisma.userAction.delete({
      where: {
        txHashes: sortedTxHashes,
      },
    });

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
});
