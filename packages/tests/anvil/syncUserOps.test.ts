import { describe, expect, it } from 'vitest';
import { anvil } from 'viem/chains';
import {
  createStealthAccountForTestUser,
  getTestClient,
  transfer,
  waitFor,
} from '../lib/utils';
import prisma from '../lib/prisma';
import {
  devChains,
  generateRandomMultiChainTag,
  RAYLAC_PAYMASTER_V2_ADDRESS,
} from '@raylac/shared';
import { logger } from '../../shared-backend/out';
import { Hex, parseEther, zeroAddress } from 'viem';

const waitForUserOpSync = async ({ txHash }: { txHash: Hex }) => {
  return waitFor({
    fn: async () => {
      const userOp = await prisma.userOperation.findFirst({
        where: {
          transactionHash: txHash,
        },
      });

      return userOp !== null;
    },
    timeout: 20 * 1000,
    label: 'waitForUserOpSync',
  });
};

/**
 * Test that the indexer correctly backfills announcements.
 * Steps
 * 1. Create a new stealth account
 * 2. Submit a UserOperation from the stealth account created in 1.
 * 3. Check that the UserOperation is correctly indexed
 */
describe('syncUserOps', () => {
  it('should backfill UserOperations', async () => {
    // ###################################
    // 1: Create a stealth accounts
    // ###################################

    const ANNOUNCEMENT_CHAIN_ID = anvil.id;
    const SYNC_ON_CHAIN_IDS = [anvil.id];
    const USER_OP_CHAIN_ID = anvil.id;

    const account = await createStealthAccountForTestUser({
      syncOnChainIds: SYNC_ON_CHAIN_IDS,
      announcementChainId: ANNOUNCEMENT_CHAIN_ID,
    });

    // Fund the stealth account on all dev chains
    for (const chain of devChains) {
      const testClient = getTestClient({ chainId: chain.id });
      await testClient.setBalance({
        address: account.address,
        value: parseEther('1000'),
      });
    }

    logger.debug(`Created stealth account ${account.address}`);

    const groupTag = generateRandomMultiChainTag();

    const txHash = await transfer({
      from: account,
      to: zeroAddress,
      value: parseEther('0.0001'),
      groupTag,
      chainId: USER_OP_CHAIN_ID,
    });

    logger.debug(`Submitted transfer tx ${txHash}`);

    await waitForUserOpSync({
      txHash,
    });

    // ###################################
    // 2. Check that the UserOperation was indexed
    // ###################################

    const userOp = await prisma.userOperation.findFirst({
      select: {
        sender: true,
        nonce: true,
        paymaster: true,
        chainId: true,
      },
      where: {
        transactionHash: txHash,
      },
    });

    expect(userOp).not.toBeNull();
    expect(userOp?.sender).toBe(account.address);
    expect(userOp?.nonce).toBe(0);
    expect(userOp?.paymaster).toBe(RAYLAC_PAYMASTER_V2_ADDRESS);
    expect(userOp?.chainId).toBe(USER_OP_CHAIN_ID);
  });
});
