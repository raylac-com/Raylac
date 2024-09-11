import { StealthAddressWithEphemeral } from '@raylac/shared';
// import * as erc5564 from './erc5564';
// import { Hex } from 'viem';
import prisma from './prisma';

/**
 * Announce a new stealth account to the ERC5564 announcer contract
 * and save the account to the database
 */
export const handleNewStealthAccount = async ({
  userId,
  stealthAccount,
}: {
  userId: number;
  stealthAccount: StealthAddressWithEphemeral;
}) => {
  /*
  // Submit an announcement to the ERC5564 announcer contract
  await erc5564.announce({
    stealthAddress: stealthAccount.address as Hex,
    ephemeralPubKey: stealthAccount.ephemeralPubKey as Hex,
    viewTag: stealthAccount.viewTag as Hex,
    stealthPubKey: stealthAccount.stealthPubKey as Hex,
  });
  */

  // Save the stealth address to the user's linked stealth addresses
  await prisma.userStealthAddress.create({
    data: {
      userId,
      address: stealthAccount.address,
      stealthPubKey: stealthAccount.stealthPubKey,
      viewTag: stealthAccount.viewTag,
      ephemeralPubKey: stealthAccount.ephemeralPubKey,
    },
  });
};
