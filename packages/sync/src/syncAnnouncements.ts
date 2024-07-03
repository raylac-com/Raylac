import { ERC5564_ANNOUNCER_ADDRESS } from '@sutori/shared';
import client from './lib/viemClient';
import { Hex, decodeEventLog, parseAbi, parseAbiItem } from 'viem';
import prisma from './lib/prisma';

const announcementAbiItem = parseAbiItem(
  'event Announcement(uint256 indexed, address indexed, address indexed, bytes, bytes)'
);

const syncAnnouncements = async () => {
  const logs = await client.getLogs({
    address: ERC5564_ANNOUNCER_ADDRESS,
    event: announcementAbiItem,
    fromBlock: 'earliest',
  });

  for (const log of logs) {
    const schemeId = Number(log.args[0] as bigint);
    const stealthAddress = log.args[1] as Hex;
    const caller = log.args[2] as Hex;
    const ephemeralPubKey = log.args[3] as Hex;
    const metadata = log.args[4] as Hex;

    // If it does, add the stealth address to the user's linked stealth addresses
    const data = {
      schemeId,
      stealthAddress: stealthAddress,
      caller: caller,
      ephemeralPubKey: ephemeralPubKey,
      metadata: metadata,
      txIndex: log.transactionIndex,
      logIndex: log.logIndex,
      blockNumber: log.blockNumber,
      chainId: client.chain.id,
    };

    await prisma.eRC5564Announcement.upsert({
      create: data,
      update: data,
      where: {
        blockNumber_logIndex_txIndex_chainId: {
          blockNumber: log.blockNumber,
          logIndex: log.logIndex,
          txIndex: log.transactionIndex,
          chainId: client.chain.id,
        },
      },
    });
  }
};

export default syncAnnouncements;
