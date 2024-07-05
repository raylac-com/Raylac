import { Hex } from 'viem';
import {
  encodeERC5564Metadata,
  ERC5564_ANNOUNCER_ADDRESS,
  ERC5564AnnouncerAbi,
  formatERC5564AnnouncementLog,
} from '@sutori/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { publicClient, walletClient } from './viem';
import prisma from './prisma';

const SCHEME_ID = BigInt(1);

const ANNOUNCER_PRIVATE_KEY = process.env.ANNOUNCER_PRIVATE_KEY;

if (!ANNOUNCER_PRIVATE_KEY) {
  throw new Error('ANNOUNCER_PRIVATE_KEY is required');
}

const announcerAccount = privateKeyToAccount(ANNOUNCER_PRIVATE_KEY as Hex);

export const announce = async ({
  stealthAddress,
  ephemeralPubKey,
  viewTag,
  stealthPubKey,
}: {
  stealthAddress: Hex;
  ephemeralPubKey: Hex;
  viewTag: Hex;
  stealthPubKey: Hex;
}) => {
  console.log('Announcing', stealthAddress, ephemeralPubKey);
  const metadata = encodeERC5564Metadata({
    viewTag: viewTag as Hex,
    stealthPubKey: stealthPubKey as Hex,
  });

  const txHash = await walletClient.writeContract({
    account: announcerAccount,
    abi: ERC5564AnnouncerAbi,
    address: ERC5564_ANNOUNCER_ADDRESS,
    functionName: 'announce',
    args: [SCHEME_ID, stealthAddress, ephemeralPubKey, metadata],
  });

  const txReceipt = await publicClient.getTransactionReceipt({
    hash: txHash,
  });

  for (const log of txReceipt.logs) {
    // If it does, add the stealth address to the user's linked stealth addresses
    const data = formatERC5564AnnouncementLog({
      log,
      chainId: publicClient.chain.id,
    });

    await prisma.eRC5564Announcement.upsert({
      create: data,
      update: data,
      where: {
        blockNumber_logIndex_txIndex_chainId: {
          blockNumber: log.blockNumber,
          logIndex: log.logIndex,
          txIndex: log.transactionIndex,
          chainId: publicClient.chain.id,
        },
      },
    });
  }

  return txHash;
};
