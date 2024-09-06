import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { JWT_PRIV_KEY } from '../utils';

const SIGNUP_BONUS_PAYER_PRIV_KEY = process.env.SIGNUP_BONUS_PAYER_PRIV_KEY;

if (!SIGNUP_BONUS_PAYER_PRIV_KEY) {
  throw new Error('Missing SIGNUP_BONUS_PAYER_PRIV_KEY');
}

/**
 * Sign up a new user.
 * - Save the user to the database
 * - Mark the invite code as used
 * - Send a sign-up bonus to the user
 * @returns The `user` object and a JWT token
 */
const signUp = async ({
  viewingPrivKey,
  inviteCode,
  spendingPubKey,
  name,
  username,
}: {
  viewingPrivKey: Hex;
  inviteCode: string;
  spendingPubKey: Hex;
  name: string;
  username: string;
}) => {
  const viewingAccount = privateKeyToAccount(viewingPrivKey as Hex);

  // TODO: Check username validity

  /*
  const inviteCodeExists = await prisma.inviteCode.findFirst({
    where: {
      inviteCode,
      isUsed: false,
    },
  });

  if (!inviteCodeExists) {
    throw new Error('Invalid invite code');
  }
    */

  const user = await prisma.user.create({
    data: {
      name: name,
      username: username,
      spendingPubKey: spendingPubKey,
      viewingPubKey: viewingAccount.publicKey,
      viewingPrivKey: viewingPrivKey,
    },
  });

  const token = jwt.sign({ userId: user.id }, JWT_PRIV_KEY);

  return {
    user,
    token,
  };
};

export default signUp;
