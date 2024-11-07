import { Hex } from 'viem';
import {
  encodeERC5564Metadata,
  ERC5564_ANNOUNCEMENT_CHAIN,
  ERC5564_ANNOUNCER_ADDRESS,
  ERC5564_SCHEME_ID,
  ERC5564AnnouncerAbi,
  getSenderAddressV2,
  getWalletClient,
  StealthAddressWithEphemeral,
} from '@raylac/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { logger } from '../utils';

const ANNOUNCER_PRIVATE_KEY = process.env.ANNOUNCER_PRIVATE_KEY;

if (!ANNOUNCER_PRIVATE_KEY) {
  throw new Error('ANNOUNCER_PRIVATE_KEY is required');
}

const announcerAccount = privateKeyToAccount(ANNOUNCER_PRIVATE_KEY as Hex);

export const announce = async (stealthAccount: StealthAddressWithEphemeral) => {
  const metadata = encodeERC5564Metadata(stealthAccount.viewTag);

  // Sanity check that the stealth account matches the ERC5564_SCHEME_ID version
  if (
    stealthAccount.address !==
    getSenderAddressV2({
      stealthSigner: stealthAccount.signerAddress,
    })
  ) {
    throw new Error(
      `Stealth account ${stealthAccount.address} does not match ERC5564_SCHEME_ID version ${ERC5564_SCHEME_ID}`
    );
  }

  const walletClient = getWalletClient({
    chainId: ERC5564_ANNOUNCEMENT_CHAIN.id,
  });

  try {
    await walletClient.writeContract({
      account: announcerAccount,
      abi: ERC5564AnnouncerAbi,
      address: ERC5564_ANNOUNCER_ADDRESS,
      functionName: 'announce',
      args: [
        ERC5564_SCHEME_ID,
        stealthAccount.signerAddress,
        stealthAccount.ephemeralPubKey,
        metadata,
      ],
    });
  } catch (_err) {
    logger.warn('Failed to announce stealth address', {
      stealthAccount,
      error: _err,
    });
  }
};
