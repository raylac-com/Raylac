import { UserOperation, sendUserOperation } from '@sutori/shared';
import { getTransferDataFromUserOp } from '../utils';
import { publicClient } from '../lib/viem';
import { saveStealthTransfer } from '../lib/stealthTransfer';
import prisma from '../lib/prisma';
import { handleNewStealthAccount } from '../lib/stealthAccount';
import { Hex } from 'viem';

/**
 * Send a transfer to a stealth account.
 * Signed user operations should be provided.
 */
const send = async ({
  userOps,
  stealthAccount,
  senderUserId,
}: {
  userOps: UserOperation[];
  stealthAccount?: {
    viewTag: string;
    stealthPubKey: string;
    ephemeralPubKey: string;
  };
  senderUserId: number;
}) => {
  const transfers = userOps.map(getTransferDataFromUserOp);

  const to = transfers[0].to;

  // Check that the transfers are all going to the same address
  if (transfers.some(transfer => transfer.to !== to)) {
    throw new Error('Transfers must all be to the same address');
  }

  const transferAmount = transfers.reduce((acc, transfer) => {
    return acc + BigInt(transfer.amount);
  }, BigInt(0));

  const userOpHashes = [];

  for (const userOp of userOps) {
    const userOpHash = await sendUserOperation({
      client: publicClient,
      userOp,
    });
    userOpHashes.push(userOpHash);
  }

  await saveStealthTransfer({
    senderId: senderUserId,
    amount: transferAmount,
    to,
    userOpHashes,
  });

  if (stealthAccount) {
    // If `stealthAccount` is provided, this is a transfer to a stealth account.
    // Announce the stealth account to the ERC5564 announcer contract.

    // Get the user who corresponds to the stealth account
    const stealthAccountUser = await prisma.userStealthAddress.findFirst({
      select: {
        userId: true,
      },
      where: {
        address: to,
      },
    });

    if (stealthAccountUser) {
      await handleNewStealthAccount({
        userId: stealthAccountUser.userId,
        stealthAccount: {
          address: to as Hex,
          stealthPubKey: stealthAccount.stealthPubKey as Hex,
          ephemeralPubKey: stealthAccount.ephemeralPubKey as Hex,
          viewTag: stealthAccount.viewTag as Hex,
        },
      });
    } else {
      console.error('Stealth account user not found');
    }
  }
};


export default send;