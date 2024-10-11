import {
  checkStealthAddress,
  decodeERC5564MetadataAsViewTag,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { sleep } from './lib/utils';
import { webcrypto } from 'node:crypto';
import { Hex } from 'viem';
import logger from './lib/logger';
import { getSenderAddress } from '@raylac/shared/src/stealth';
import { Prisma } from '@prisma/client';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const getAnnouncements = async () => {
  const result = await prisma.eRC5564Announcement.findMany({
    select: {
      stealthAddress: true,
      ephemeralPubKey: true,
      metadata: true,
    },
  });

  return result;
};

const assignStealthAddressToUser = async ({
  ephemeralPubKey,
  signerAddress,
  viewTag,
  userId,
}: {
  ephemeralPubKey: Hex;
  signerAddress: Hex;
  viewTag: Hex;
  userId: number;
}) => {
  const stealthAddress = getSenderAddress({
    stealthSigner: signerAddress,
  });

  const alreadyAssigned = await prisma.userStealthAddress.findFirst({
    select: {
      userId: true,
      address: true,
    },
    where: {
      address: stealthAddress,
    },
  });

  if (alreadyAssigned && alreadyAssigned.userId !== userId) {
    logger.error(
      `Conflicting stealth address assignment: ${stealthAddress} already assigned to user ${alreadyAssigned.userId}, but trying to assign to ${userId}`
    );

    return;
  }

  if (alreadyAssigned) {
    return;
  }

  logger.info(`Assigning stealth address ${stealthAddress} to user ${userId}`);

  const data: Prisma.UserStealthAddressCreateInput = {
    address: stealthAddress,
    ephemeralPubKey,
    signerAddress,
    viewTag,
    user: {
      connect: {
        id: userId,
      },
    },
  };

  await prisma.userStealthAddress.upsert({
    create: data,
    update: data,
    where: {
      address: stealthAddress,
    },
  });
};

const scanStealthAddresses = async () => {
  // For all view keys, check if any of the announcements match the view key

  while (true) {
    const users = await prisma.user.findMany();

    const announcements = await getAnnouncements();

    for (const announcement of announcements) {
      let viewTag: Hex;
      try {
        const decoded = decodeERC5564MetadataAsViewTag(
          announcement.metadata as Hex
        );

        viewTag = decoded.viewTag;
      } catch (_err) {
        // TODO: Log warning

        // Skip this announcement as we can't decode the metadata
        continue;
      }

      const signerAddress = announcement.stealthAddress as Hex;
      const ephemeralPubKey = announcement.ephemeralPubKey as Hex;

      const matchedUser = users.find(user => {
        return checkStealthAddress({
          viewTag,
          signerAddress,
          ephemeralPubKey,
          spendingPubKey: user.spendingPubKey as Hex,
          viewingPrivKey: user.viewingPrivKey as Hex,
        });
      });

      if (matchedUser) {
        await assignStealthAddressToUser({
          ephemeralPubKey,
          signerAddress,
          viewTag,
          userId: matchedUser.id,
        });
      } else {
        console.log(
          `No user match stealth address ${announcement.stealthAddress}`
        );
      }
    }

    await sleep(15 * 1000);
  }
};

export default scanStealthAddresses;
