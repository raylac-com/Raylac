import { beforeAll, describe, expect, it } from 'vitest';
import { anvil } from 'viem/chains';
import {
  createStealthAccountForTestUser,
  getTestClient,
  waitFor,
} from '../lib/utils';
import prisma from '../lib/prisma';
import {
  getChainName,
  getPublicClient,
  getWalletClient,
  MockERC20Abi,
  MOCK_ERC20_ADDRESS,
} from '@raylac/shared';
import { getAddress, Hex, parseEther, parseUnits, zeroAddress } from 'viem';
import { getAuthedClient } from '../lib/rpc';
import { logger } from '@raylac/shared-backend';

const testClient = getTestClient({ chainId: anvil.id });
const walletClient = getWalletClient({ chainId: anvil.id });
const publicClient = getPublicClient({ chainId: anvil.id });

const waitForSync = async ({ txHash }: { txHash: Hex }) => {
  await waitFor({
    fn: async () => {
      const tx = await prisma.trace.findFirst({
        where: {
          transactionHash: txHash,
        },
      });

      return tx !== null;
    },
    timeout: 60 * 1000,
    interval: 1000,
    label: 'syncNativeTransfers',
  });
};

/**
 * Test that the indexer correctly backfills ERC20 transfers.
 * Steps
 * 1. Create new stealth addresses
 * 2. Send ERC20 tokens to the new stealth addresses on anvil
 * 3. Check that the transfers of 2. are indexed
 */
describe('syncERC20Transfers', () => {
  beforeAll(async () => {
    // Delete all the data on the anvil chain from the database we're testing against
    const authedClient = await getAuthedClient();
    await authedClient.pruneAnvil.mutate();
  });

  it('should backfill ERC20 transfers', async () => {
    // ###################################
    // 1. Create stealth addresses for testing
    // ###################################

    const account = await createStealthAccountForTestUser({
      syncOnChainIds: [anvil.id],
      announcementChainId: anvil.id,
    });

    logger.debug(`Created stealth account ${account.address}`);

    // ###################################
    // 2. Send ERC20 token to the stealth addresses created in 1.
    // ###################################

    const minter = zeroAddress;
    await testClient.setBalance({
      address: minter,
      value: parseEther('100'),
    });

    const SEND_AMOUNT = parseUnits('100', 6);

    // Store tx hashes of the transfers from the impersonated sender to the stealth addresses created in 1.

    // Mint tokens to the stealth account from the impersonated master minter

    await testClient.impersonateAccount({
      address: minter,
    });

    // Mint tokens to the stealth account
    // We test the indexing of the `Transfer` event by calling the `_mint` function which emits a `Transfer` event
    const txHash = await walletClient.writeContract({
      address: MOCK_ERC20_ADDRESS,
      account: minter,
      abi: MockERC20Abi,
      functionName: 'mint',
      args: [account.address, SEND_AMOUNT],
    });

    logger.debug(
      `Minted ${SEND_AMOUNT} tokens to ${account.address} on ${getChainName(
        anvil.id
      )}. tx: ${txHash}`
    );

    await testClient.stopImpersonatingAccount({
      address: minter,
    });

    // Wait for the transfers to be indexed
    await waitForSync({
      txHash,
    });

    // ###################################
    // 3. Check that the transfers were indexed
    // ###################################

    // Get the `Transaction` objects from the tx hashes
    const tx = await publicClient.getTransaction({ hash: txHash });

    // Get the `Trace` records from the database
    const trace = await prisma.trace.findFirst({
      select: {
        transactionHash: true,
        from: true,
        to: true,
        amount: true,
        chainId: true,
        Transaction: {
          select: {
            block: {
              select: {
                number: true,
                hash: true,
                timestamp: true,
              },
            },
          },
        },
      },
      where: {
        transactionHash: txHash,
      },
    });

    // Check that each `Trace` record is correct
    expect(trace).toBeDefined();
    expect(trace!.chainId).toBe(anvil.id);
    expect(trace!.from).toBe(zeroAddress);
    expect(getAddress(trace!.to)).toBe(account.address);
    expect(BigInt(trace!.amount.toNumber())).toBe(SEND_AMOUNT);
    expect(trace!.Transaction.block.number).toBe(tx!.blockNumber);
    expect(trace!.Transaction.block.hash).toBe(tx!.blockHash);
    expect(trace!.Transaction.block.timestamp).toBeDefined();
  });
});
