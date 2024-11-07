import { StealthAddressWithEphemeral } from '@raylac/shared';
import prisma from '../lib/prisma';
import * as erc5564 from '../lib/erc5564';
import { TRPCError } from '@trpc/server';

const MAX_STEALTH_ACCOUNTS = 500;

/**
 * Check if the user can add a stealth account.
 * We implement a limit of 500 stealth accounts per user.
 */
const canUserAddStealthAccount = async (userId: number) => {
  const numStealthAccounts = await prisma.userStealthAddress.count({
    where: {
      userId,
    },
  });

  return numStealthAccounts < MAX_STEALTH_ACCOUNTS;
};

const addStealthAccount = async ({
  userId,
  stealthAccount,
  label,
}: {
  userId: number;
  stealthAccount: StealthAddressWithEphemeral;
  label: string;
}) => {
  const canAdd = await canUserAddStealthAccount(userId);

  if (!canAdd) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `User ${userId} has exceeded the maximum number of stealth accounts`,
    });
  }

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
  erc5564.announce(stealthAccount);
};

export default addStealthAccount;
