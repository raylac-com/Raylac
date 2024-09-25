import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { JWT_PRIV_KEY } from '../utils';

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

  // TODO: Check username validity

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
