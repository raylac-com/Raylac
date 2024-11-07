import { Log, decodeEventLog, parseAbi } from 'viem';
import { ERC5564AnnouncementData } from './types';
import { base } from 'viem/chains';
import { getSenderAddressV2 } from './stealth';

export const ERC5564_ANNOUNCEMENT_CHAIN = base;

export const ERC5564_SCHEME_ID = BigInt(2);

export const formatERC5564AnnouncementLog = ({
  log,
  chainId,
}: {
  log: Log;
  chainId: number;
}): ERC5564AnnouncementData => {
  const decodedLog = decodeEventLog({
    abi: parseAbi([
      'event Announcement(uint256 indexed schemeId, address indexed stealthAddress, address indexed caller, bytes ephemeralPubKey, bytes metadata)',
    ]),
    data: log.data,
    topics: log.topics,
  });

  const schemeId = Number(decodedLog.args.schemeId);
  const stealthAddress = decodedLog.args.stealthAddress;
  const address = getSenderAddressV2({
    stealthSigner: stealthAddress,
  });
  const caller = decodedLog.args.caller;
  const ephemeralPubKey = decodedLog.args.ephemeralPubKey;
  const metadata = decodedLog.args.metadata;

  return {
    address,
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
