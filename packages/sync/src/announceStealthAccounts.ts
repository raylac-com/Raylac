// This file is responsible for announcing unannounced stealth accounts to the ERC5564 announcer contract
// Stealth accounts are usually announced when they are created, but announcements can be reverted in case of an reorg.
// This file makes sure all stealth accounts are announced even under those circumstances.

import {
  ERC5564_ANNOUNCEMENT_CHAIN,
  ERC5564_ANNOUNCER_ADDRESS,
  ERC5564_ANNOUNCER_DEPLOYED_BLOCK,
  ERC5564_SCHEME_ID,
  ERC5564AnnouncerAbi,
  getWalletClient,
  sleep,
  StealthAddressWithEphemeral,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { Hex } from 'viem';
import { getPublicClient } from '@raylac/shared';
import { announcementAbiItem } from './utils';
import logger from './lib/logger';
import { privateKeyToAccount } from 'viem/accounts';

const publicClient = getPublicClient({
  chainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
});

const walletClient = getWalletClient({
  chainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
});

const ANNOUNCER_PRIVATE_KEY = process.env.ANNOUNCER_PRIVATE_KEY;

if (!ANNOUNCER_PRIVATE_KEY) {
  throw new Error('ANNOUNCER_PRIVATE_KEY is required');
}

const announcerAccount = privateKeyToAccount(ANNOUNCER_PRIVATE_KEY as Hex);

/**
 * Check if a stealth address has been announced.
 * Checks the event logs database first, if not found, it checks the chain.
 * @returns true if the stealth address has been announced, false otherwise.
 */
const isAnnounced = async (signerAddress: Hex): Promise<boolean> => {
  // Check the database

  const announcement = await prisma.eRC5564Announcement.findFirst({
    where: {
      stealthAddress: signerAddress,
    },
  });

  if (announcement) {
    return true;
  }

  // Check if the log exists on chain
  const logs = await publicClient.getLogs({
    address: ERC5564_ANNOUNCER_ADDRESS,
    event: announcementAbiItem,
    args: {
      schemeId: ERC5564_SCHEME_ID,
      stealthAddress: signerAddress,
    },
    fromBlock: ERC5564_ANNOUNCER_DEPLOYED_BLOCK,
    toBlock: 'latest',
  });

  if (logs.length === 0) {
    return false;
  }

  // Sanity check 1
  if (logs.length !== 1) {
    logger.warn(
      `Expected 1 log for signer address ${signerAddress}, got ${logs.length}`
    );
  }

  const log = logs[0];

  // Sanity check 2
  if (log.args.stealthAddress !== signerAddress) {
    throw new Error(
      `Stealth address mismatch for log ${log.transactionHash}: ${log.args.stealthAddress} !== ${signerAddress}`
    );
  }

  // Sanity check 3
  if (log.args.schemeId !== ERC5564_SCHEME_ID) {
    throw new Error(
      `Scheme ID mismatch for log ${log.transactionHash}: ${log.args.schemeId} !== ${ERC5564_SCHEME_ID}`
    );
  }

  return true;
};

const announceStealthAccount = async (
  stealthAccount: StealthAddressWithEphemeral
) => {
  try {
    await walletClient.writeContract({
      address: ERC5564_ANNOUNCER_ADDRESS,
      abi: ERC5564AnnouncerAbi,
      functionName: 'announce',
      args: [
        ERC5564_SCHEME_ID,
        stealthAccount.signerAddress,
        stealthAccount.ephemeralPubKey,
        stealthAccount.viewTag as Hex,
      ],
      account: announcerAccount,
    });
  } catch (_err) {
    logger.warn(
      `Error announcing stealth account ${stealthAccount.signerAddress}: ${_err}`
    );
  }
};

export const announceStealthAccounts = async () => {
  while (true) {
    const stealthAccounts = await prisma.userStealthAddress.findMany({
      select: {
        address: true,
        signerAddress: true,
        ephemeralPubKey: true,
        viewTag: true,
      },
      where: {
        signerAddress: {
          not: null,
        },
      },
    });

    for (const stealthAccount of stealthAccounts) {
      if (await isAnnounced(stealthAccount.signerAddress as Hex)) {
        logger.debug(
          `Stealth account ${stealthAccount.address} already announced`
        );
        continue;
      }

      logger.info(`Announcing stealth account ${stealthAccount.address}`);
      await announceStealthAccount(
        stealthAccount as StealthAddressWithEphemeral
      );
    }

    await sleep(60 * 1000);
  }
};
