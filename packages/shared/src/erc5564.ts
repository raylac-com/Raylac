import { Log, decodeEventLog, parseAbi } from 'viem';
import { ERC5564Announcement } from '@prisma/client';

export const formatERC5564AnnouncementLog = ({
  log,
  chainId,
}: {
  log: Log;
  chainId: number;
}): Omit<ERC5564Announcement, 'id' | 'createdAt' | 'updatedAt'> => {
  const decodedLog = decodeEventLog({
    abi: parseAbi([
      'event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed caller, bytes ephemeralPubKey, bytes metadata)',
    ]),
    // `data` should be 64 bytes, but is only 32 bytes.
    data: '0x0000000000000000000000000000000000000000000000000000000000000001',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    ],
  });

  const schemeId = Number(decodedLog.args.schemeId);
  const stealthAddress = decodedLog.args.stealthAddress;
  const caller = decodedLog.args.caller;
  const ephemeralPubKey = decodedLog.args.ephemeralPubKey;
  const metadata = decodedLog.args.metadata;

  return {
    schemeId,
    stealthAddress,
    caller,
    ephemeralPubKey,
    metadata,
    txIndex: log.transactionIndex!,
    logIndex: log.logIndex!,
    blockNumber: log.blockNumber!,
    chainId,
  };
};
