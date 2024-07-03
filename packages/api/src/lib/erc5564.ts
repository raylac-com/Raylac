import { encodePacked, Hex } from 'viem';
import { ERC5564_ANNOUNCER_ADDRESS, ERC5564AnnouncerAbi } from '@sutori/shared';
import { walletClient, account } from './viemClient';

const SCHEME_ID = BigInt(1);

export const announce = async ({
  stealthAddress,
  ephemeralPubKey,
  metadata
}: {
  stealthAddress: Hex;
  ephemeralPubKey: Hex;
  metadata: Hex;
}) => {
  console.log('Announcing', stealthAddress, ephemeralPubKey, metadata);
  /*
  const txHash = await walletClient.writeContract({
    account,
    abi: ERC5564AnnouncerAbi,
    address: ERC5564_ANNOUNCER_ADDRESS,
    functionName: 'announce',
    args: [SCHEME_ID, stealthAddress, ephemeralPubKey, viewTag],
  });

  return txHash;
  */
};
