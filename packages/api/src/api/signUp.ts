import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { JWT_PRIV_KEY } from '../utils';
import { isValidUsername } from '@raylac/shared';
import { TRPCError } from '@trpc/server';

/**
 * Sign up a new user.
 * - Save the user to the database
 * - Send a sign-up bonus to the user
 * @returns The `user` object and a JWT token
 */
const signUp = async ({
  viewingPrivKey,
  spendingPubKey,
  name,
  username,
}: {
  viewingPrivKey: Hex;
  spendingPubKey: Hex;
  name: string;
  username: string;
}) => {
  const viewingAccount = privateKeyToAccount(viewingPrivKey as Hex);

  if (!isValidUsername(username)) {
    throw new Error('Invalid username');
  }

  const isUsernameTaken = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });

  if (isUsernameTaken) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Username already taken',
    });
  }

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
