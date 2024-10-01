import { checkStealthAddress, decodeERC5564Metadata } from '@raylac/shared';
import prisma from './lib/prisma';
import { sleep } from './lib/utils';
import { webcrypto } from 'node:crypto';
import { Hex } from 'viem';

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
  stealthAddress,
  ephemeralPubKey,
  stealthPubKey,
  viewTag,
  userId,
}: {
  stealthAddress: Hex;
  ephemeralPubKey: Hex;
  stealthPubKey: Hex;
  viewTag: Hex;
  userId: number;
}) => {
  await prisma.userStealthAddress.create({
    data: {
      address: stealthAddress,
      ephemeralPubKey,
      stealthPubKey,
      viewTag,
      userId,
    },
  });
};

const scanStealthAddresses = async () => {
  // For all view keys, check if any of the announcements match the view key

  while (true) {
    const users = await prisma.user.findMany();

    const announcements = await getAnnouncements();

    for (const announcement of announcements) {
      const decodedMetadata = decodeERC5564Metadata(
        announcement.metadata as Hex
      );

      const viewTag = decodedMetadata.viewTag;

      const stealthAddress = announcement.stealthAddress as Hex;
      const ephemeralPubKey = announcement.ephemeralPubKey as Hex;
      const stealthPubKey = decodedMetadata.stealthPubKey;

      const matchedUser = users.find(user => {
        return checkStealthAddress({
          viewTag,
          stealthPubKey: decodedMetadata.stealthPubKey,
          ephemeralPubKey: ephemeralPubKey,
          spendingPubKey: user.spendingPubKey as Hex,
          viewingPrivKey: user.viewingPrivKey as Hex,
        });
      });

      if (matchedUser) {
        await assignStealthAddressToUser({
          stealthAddress,
          ephemeralPubKey,
          stealthPubKey,
          viewTag,
          userId: matchedUser.id,
        });
      } else {
        console.log(
          `No user match stealth address ${announcement.stealthAddress}`
        );
      }
    }

    await sleep(5000);
  }
};

export default scanStealthAddresses;
