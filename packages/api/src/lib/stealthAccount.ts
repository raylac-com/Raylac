import { StealthAddressWithEphemeral } from '@raylac/shared';
import * as erc5564 from './erc5564';
import { Hex } from 'viem';
import prisma from './prisma';

/**
 * Announce a new stealth account to the ERC5564 announcer contract
 * and save the account to the database
 */
export const handleNewStealthAccount = async ({
  userId,
  stealthAccount,
  label,
}: {
  userId: number;
  stealthAccount: StealthAddressWithEphemeral;
  label: string;
}) => {
  // TODO: Verify that the stealth account corresponds to the specified user

  // Save the stealth address to the user's linked stealth addresses
  await prisma.userStealthAddress.create({
    data: {
      userId,
      address: stealthAccount.address,
      signerAddress: stealthAccount.signerAddress,
      viewTag: stealthAccount.viewTag,
      ephemeralPubKey: stealthAccount.ephemeralPubKey,
      label,
    },
  });

  // Submit an announcement to the ERC5564 announcer contract.
  // We don't await this because it's slow and we don't want to block the response.
  erc5564.announce({
    signerAddress: stealthAccount.signerAddress as Hex,
    ephemeralPubKey: stealthAccount.ephemeralPubKey as Hex,
    viewTag: stealthAccount.viewTag as Hex,
  });
};
