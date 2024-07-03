import { checkStealthAddress, decodeERC5564Metadata } from '@sutori/shared';
import prisma from './lib/prisma';
import { sleep } from './lib/utils';
import * as secp from '@noble/secp256k1';
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
  userId,
}: {
  stealthAddress: string;
  userId: number;
}) => {
  await prisma.userStealthAddress.create({
    data: {
      address: stealthAddress,
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
      const stealthPubKey = secp.ProjectivePoint.fromHex(
        decodedMetadata.stealthPubKey
      );

      const ephemeralPubKey = secp.ProjectivePoint.fromHex(
        announcement.ephemeralPubKey
      );

      const matchedUser = users.find(user => {
        const spendingPubKey = secp.ProjectivePoint.fromHex(
          user.spendingPubKey
        );

        return checkStealthAddress({
          viewTag,
          stealthPubKey,
          ephemeralPubKey,
          spendingPubKey,
          viewingPrivKey: BigInt(user.viewingPrivKey),
        });
      });

      if (matchedUser) {
        await assignStealthAddressToUser({
          stealthAddress: announcement.stealthAddress,
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
