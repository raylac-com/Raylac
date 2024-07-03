import { Hex } from 'viem';
import {
  ERC5564_ANNOUNCER_ADDRESS,
  ERC5564AnnouncerAbi,
} from '@sutori/shared';
import { privateKeyToAccount } from 'viem/accounts';
import { walletClient } from './viem';

const SCHEME_ID = BigInt(1);

const ANNOUNCER_PRIVATE_KEY = process.env.ANNOUNCER_PRIVATE_KEY;

if (!ANNOUNCER_PRIVATE_KEY) {
  throw new Error('ANNOUNCER_PRIVATE_KEY is required');
}

const announcerAccount = privateKeyToAccount(ANNOUNCER_PRIVATE_KEY as Hex);

export const announce = async ({
  stealthAddress,
  ephemeralPubKey,
  metadata,
}: {
  stealthAddress: Hex;
  ephemeralPubKey: Hex;
  metadata: Hex;
}) => {
  console.log('Announcing', stealthAddress, ephemeralPubKey, metadata);

  const txHash = await walletClient.writeContract({
    account: announcerAccount,
    abi: ERC5564AnnouncerAbi,
    address: ERC5564_ANNOUNCER_ADDRESS,
    functionName: 'announce',
    args: [SCHEME_ID, stealthAddress, ephemeralPubKey, metadata],
  });

  return txHash;
};
