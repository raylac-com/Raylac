import { Hex } from 'viem';
import {
  encodeERC5564Metadata,
  ERC5564_ANNOUNCEMENT_CHAIN,
  ERC5564_ANNOUNCER_ADDRESS,
  ERC5564_SCHEME_ID,
  ERC5564AnnouncerAbi,
  getWalletClient,
} from '@raylac/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { logger } from '../utils';

const ANNOUNCER_PRIVATE_KEY = process.env.ANNOUNCER_PRIVATE_KEY;

if (!ANNOUNCER_PRIVATE_KEY) {
  throw new Error('ANNOUNCER_PRIVATE_KEY is required');
}

const announcerAccount = privateKeyToAccount(ANNOUNCER_PRIVATE_KEY as Hex);

export const announce = async ({
  signerAddress,
  ephemeralPubKey,
  viewTag,
}: {
  signerAddress: Hex;
  ephemeralPubKey: Hex;
  viewTag: Hex;
}) => {
  const metadata = encodeERC5564Metadata(viewTag);

  const walletClient = getWalletClient({
    chainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
  });

  try {
    await walletClient.writeContract({
      account: announcerAccount,
      abi: ERC5564AnnouncerAbi,
      address: ERC5564_ANNOUNCER_ADDRESS,
      functionName: 'announce',
      args: [ERC5564_SCHEME_ID, signerAddress, ephemeralPubKey, metadata],
    });
  } catch (_err) {
    logger.warn('Failed to announce stealth address', {
      signerAddress,
      ephemeralPubKey,
      viewTag,
      error: _err,
    });
  }
};
