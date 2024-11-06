import {
  checkStealthAddress,
  decodeERC5564MetadataAsViewTag,
  getSenderAddressV2,
  sleep,
} from '@raylac/shared';
import prisma from './lib/prisma';
import { webcrypto } from 'node:crypto';
import { Hex } from 'viem';
import { logger } from './utils';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

/**
 * Get all address announcements with schemeId 2 (v2 stealth addresses)
 * from the database
 */
const getV2Announcements = async () => {
  const result = await prisma.eRC5564Announcement.findMany({
    select: {
      stealthAddress: true,
      ephemeralPubKey: true,
      metadata: true,
    },
    where: {
      schemeId: 2,
    },
  });

  return result;
};

/**
 * Create a `UserStealthAddress` record for the given stealth address
 * This is called when a stealth address is detected to match a user's view and spending keys
 */
const saveUserStealthAddress = async ({
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
  const stealthAddress = getSenderAddressV2({
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

const algorithm = 'aes-256-cbc';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is not set');
}

/**
 * Decrypt data.
 * This is used to decrypt the viewing private key so it can be securely retrieved from the database.
 */
const decryptViewingPrivKey = (encryptedViewingPrivKey: Hex) => {
  const iv = Buffer.from(
    encryptedViewingPrivKey.replace('0x', '').slice(0, 32),
    'hex'
  );
  const encryptedData = encryptedViewingPrivKey.replace('0x', '').slice(32);

  const buff = Buffer.from(encryptedData, 'hex');
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  return (
    decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
    decipher.final('utf8')
  );
};

const scanStealthAddresses = async () => {
  // For all view keys, check if any of the announcements match the view key

  while (true) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          spendingPubKey: true,
          encryptedViewingPrivKey: true,
        },
      });

      const usersWithViewingPrivKey = users.map(user => {
        const viewingPrivKey = decryptViewingPrivKey(
          user.encryptedViewingPrivKey as Hex
        );

        return {
          ...user,
          viewingPrivKey,
        };
      });

      const announcements = await getV2Announcements();

      for (const announcement of announcements) {
        let viewTag: Hex;
        try {
          const decoded = decodeERC5564MetadataAsViewTag(
            announcement.metadata as Hex
          );

          viewTag = decoded.viewTag;
          // TODO: Assign account version
        } catch (_err) {
          logger.warn('Failed to decode stealth address metadata', {
            metadata: announcement.metadata,
            error: _err,
          });

          // Skip this announcement as we can't decode the metadata
          continue;
        }

        const signerAddress = announcement.stealthAddress as Hex;
        const ephemeralPubKey = announcement.ephemeralPubKey as Hex;

        const matchedUser = usersWithViewingPrivKey.find(user => {
          return checkStealthAddress({
            viewTag,
            signerAddress,
            ephemeralPubKey,
            spendingPubKey: user.spendingPubKey as Hex,
            viewingPrivKey: user.viewingPrivKey as Hex,
          });
        });

        if (matchedUser) {
          await saveUserStealthAddress({
            ephemeralPubKey,
            signerAddress,
            viewTag,
            userId: matchedUser.id,
          });
        }
      }
    } catch (error) {
      logger.error('Error scanning stealth addresses', { error });
    }

    await sleep(15 * 1000);
  }
};

export default scanStealthAddresses;
