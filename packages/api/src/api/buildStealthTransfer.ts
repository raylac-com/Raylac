import prisma from '@/lib/prisma';
import {
  generateStealthAddress,
  getRandomBigInt,
  StealthAddressWithEphemeral,
  StealthTransferData,
} from '@sutori/shared';
import { Hex } from 'viem';

const MIN_BUFF_AMOUNT = BigInt(0);
const MAX_BUFF_AMOUNT = BigInt(1000000000000000000);

/**
 * Build a stealth transfer by selecting the stealth accounts with the balances
 * that add up to the amount to be transferred
 */
const buildStealthTransfer = async ({
  amount,
  fromUserId,
  toUserId,
}: {
  amount: string;
  fromUserId: number;
  toUserId: number;
}): Promise<StealthTransferData> => {
  const buffAmount = getRandomBigInt({
    min: MIN_BUFF_AMOUNT,
    max: MAX_BUFF_AMOUNT,
  });

  const fromUser = await prisma.user.findUnique({
    where: { id: fromUserId },
  });

  if (!fromUser) {
    throw new Error('User not found');
  }

  // Get the inputs from the database
  const inputs: StealthAddressWithEphemeral[] = [];

  // Send the amount from the stealth accounts with the highest balance

  const totalSend = BigInt(0);
  // Calculate the change
  const change = totalSend - BigInt(amount);

  // Generate a stealth addresses to send change to
  const changeReceivers = new Array(5).fill(0).map(() =>
    generateStealthAddress({
      spendingPubKey: fromUser.spendingPubKey as Hex,
      viewingPubKey: fromUser.viewingPubKey as Hex,
    })
  );

  // Just send the change to the sender
  // The buffed amount will make the outputs indistinguishable

  const toUser = await prisma.user.findUnique({
    where: { id: toUserId },
  });

  if (!toUser) {
    throw new Error('User not found');
  }

  // Generate a stealth address for each input

  const realOutputs = new Array(5).fill(0).map(_ => {
    const stealthAddressWithEphemeral = generateStealthAddress({
      spendingPubKey: toUser.spendingPubKey as Hex,
      viewingPubKey: toUser.viewingPubKey as Hex,
    });

    return stealthAddressWithEphemeral;
  });

  const innerTransfers = [];
  return innerTransfers;
};

export default buildStealthTransfer;
